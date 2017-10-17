const _ = require('underscore');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const configs = require('../configs');
const logger  = require('logger').createLogger();
const utils = require('../utils/scrape-utils');
logger.setLevel(configs.LOGGER_LEVEL);

function calculateLabelSentiment(entries) {
    if (entries.length == 0) {
        return 0
    }
    let sentiment = 0;
    entries.map(function(entry) {
        sentiment += (entry.sentiment.score * entry.sentiment.magnitude);
    })
    return sentiment / entries.length;
}

function calculateLabelScore(entries, count) {
    if (entries.length == 0) {
        return 0
    }
    let score = 0;
    entries.map(function(entry) {
        score += entry.score;
    })
    return score / count;
}

async function queryPixel(label, start_time, end_time, duration) {
    logger.info('connecting to database...');
    console.log(start_time, end_time);
    const db = await MongoClient.connect(configs.DB_URL);
    let collection = db.collection("pixel");
    
    const pixel_query = {
        timestamp: {$gt: start_time, $lt: end_time},
        key: label
    }

    const pixels = await collection.find(pixel_query).toArray();

    console.log(pixels)

    function gatherPixels(pixels, curr_time, duration) {
        const start_bound = curr_time - duration * 0.5;
        const end_bound = curr_time + duration * 0.5;

        const pixels_in_time = pixels.filter((p)=>{
            return p.timestamp > start_bound && p.timestamp < end_bound;
        })

        const ret = pixels_in_time.reduce((memo, pixel)=>{
            memo.push(...pixel.value)
            return memo
        }, [])
        
        return ret
    }

    ret = []

    let curr_time = end_time;

    while (curr_time > start_time) {
        const p = gatherPixels(pixels, curr_time, duration);
        ret.push(p)
        curr_time -= duration;
    }

    return ret

}

async function queryTwitterLabelScoresOverTime(label, type, start_time, end_time, duration) {
    logger.info('connecting to database...');
    const db = await MongoClient.connect(configs.DB_URL);
    let collection = db.collection(configs.TEST_DB_COLLECTION);
    
     const score_query = [
            {
                $match: {
                    timestamp: {$gt: start_time, $lt: end_time},
                    source: "twitter",
                    "content.entities.name": label,
                    "content.entities.type": type,
                }
            },
            {   $unwind: "$content.entities"    },
            {
                $match: {
                    "content.entities.name": label,
                    "content.entities.type": type,
                }
            },
            {
                $group: {
                    _id: "$_id",
                    name: { $first: "$content.entities.name" },
                    type:  { $first: "$content.entities.type" },
                    sentiment: { $first:"$content.entities.sentiment" },
                    score: { $first: "$content.entities.salience"},
                    timestamp: { $first: "$timestamp" },
                    local_id: {$first: "$local_id"}
                }
            },
        ];
    
    
    
    const post_count_query = {
        timestamp: {$gt: start_time, $lt: end_time},
        source: "twitter"
    }

    const post_count = await collection.find(post_count_query).count();
    let posts = await collection.aggregate(score_query).toArray();

    console.log(posts);

    let posts_over_time = [];
    let curr_time = end_time;

    async function calculateDurationScore(collection, posts, curr_time, duration) {
        const start_bound = curr_time - duration * 0.5;
        const end_bound = curr_time + duration * 0.5;

        // const start_bound = curr_time
        // const end_bound = curr_time + duration
        const posts_in_time = posts.filter((p)=>{
            return p.timestamp > start_bound && p.timestamp < end_bound;
        })

        const totol_post_count = await collection.find({
            timestamp: {$gt: start_bound, $lt: end_bound}, 
            source:"twitter"})
            .count();
        
        let sentiment = calculateLabelSentiment(posts_in_time);
        let score = calculateLabelScore(posts_in_time, totol_post_count);

        if (totol_post_count <= 0) {
            score = 0
        } 
        return {
            sentiment: sentiment,
            score: score * configs.NLP_SCORE_FACTOR
        };
    }

    let score_promise = []
    
    

    while (curr_time > start_time) {
        const score = calculateDurationScore(collection, posts, curr_time, duration);
        score_promise.push(score); 
        curr_time -= duration;
    }

    let score_over_time = await Promise.all(score_promise);

    db.close();

    return {
        description: {
            name: label,
            type: type,
        },
        start_time: start_time,
        end_time: end_time,
        duration: duration,
        scores: score_over_time,
        // images: images_over_time.slice(0, 10)
    }
     
}

function getEntityKey(entity) {
    const type = entity.type
    const name = entity.name;

    const entity_key = {
        name: name,
        type: type,
    };

    return entity_key;
}

function getEntityValue(entity) {
    
    const mag = entity.sentiment.magnitude; 
    const score = entity.sentiment.score;
    const salience = entity.salience;

    const entity_value = {
        sentiment: score * mag,
        salience: salience,
    };
    return entity_value
}

async function queryTopTwitterLabel(start_time, end_time) {
    let result_score = [];
    
    if (start_time > end_time) {
        return result_score;
    }

    logger.info('connecting to database...');
    const db = await MongoClient.connect(configs.DB_URL);
    let collection = db.collection(configs.TEST_DB_COLLECTION);

    const query = {
        timestamp: {$gt: start_time, $lt: end_time},
        source: "twitter"
    }

    const post_count = await collection.find(query).count();

    function collectEntities() {
        for (let i = 0; i < this.content.entities.length; i++) {
            const entity = this.content.entities[i];

            const mag = entity.sentiment.magnitude; 
            const score = entity.sentiment.score;
            const salience = entity.salience;

            const entity_value = {
                sentiment: score * mag,
                salience: salience,
            };

            const type = entity.type
            const name = entity.name;

            const entity_key = {
                name: name,
                type: type,
            };
            emit(entity_key, entity_value);
        }
    }

    function calculateScores(entity_key, entity_values) {
        let reduced_val = {
            sentiment: 0,
            salience: 0
        }
        for (let i = 0; i < entity_values.length; i++) {
            reduced_val.sentiment += entity_values[i].sentiment / entity_values.length;
            reduced_val.salience += entity_values[i].salience;
        }

        return reduced_val;
    }

    function normalizeScores(val) {
        val.score = val.value.salience / post_count * configs.NLP_SCORE_FACTOR;
        val.sentiment = val.value.sentiment;
        val.description = val._id;
        delete val._id;
        delete val.value;
        return val
    }

    let posts = await collection
    .mapReduce(
        collectEntities,
        calculateScores,
        {
            query: query,
            out: {inline: 1}
        }
    )
    posts = JSON.parse(JSON.stringify(posts)).map(normalizeScores).sort((a, b)=>{
        if (a.score < b.score) return 1;
        if (a.score > b.score) return -1;
        return 0
    });
    db.close();
    return posts
}



async function queryTopTumblrLabel(start_time, end_time) {

    let result_score = [];
    
    if (start_time > end_time) {
        return result_score;
    }

    logger.info('connecting to database...');
    const db = await MongoClient.connect(configs.DB_URL);
    let collection = db.collection(configs.DB_COLLECTION);
    let posts = await collection.find({timestamp: {$gt: start_time, $lt: end_time}, source: "tumblr"}).toArray();
    const count = posts.length;
    
    if (!posts) {
        return result_score;
    }

    try {
        const posts_label_scores = posts.map(post => {
            const num_images = post.content.images.length;
            let labels = _.flatten(post.content.images.map(img=>{return img.labels}))
            labels = labels.reduce((memo, obj) => {
                    if (!memo[obj.description]) { memo[obj.description] = 0; }
                    memo[obj.description] += obj.score;
                    return memo; 
                }, {});
            return _.mapObject(labels, (val, key) => {
                return val / num_images;
            })
        })
        let scores = posts_label_scores.reduce((memo, obj) => {
            _.mapObject(obj, (val, key) => {
                if (!memo[key]) { memo[key] = 0; }
                memo[key] += val;
            })
            return memo;
        })
        
        for (var k in scores) {
            if (scores.hasOwnProperty(k)) {
                result_score.push({
                    description: k,
                    score: scores[k] / count
                })
            }
        }

        result_score.sort((a, b)=>{return b.score - a.score;})
        
    } catch (error) {
        logger.error(error);
        result_score = [];
    }
    db.close();
    return result_score;

}

async function queryTumblrLabelScoresOverTime(label, start_time, end_time, duration) {
    logger.info('connecting to database...');
    const db = await MongoClient.connect(configs.DB_URL);
    let collection = db.collection(configs.DB_COLLECTION);
    // query to get score
    const score_query = [
            {
                $match: {
                    timestamp: {$gt: start_time, $lt: end_time},
                    source: "tumblr",
                    "content.images.labels.description": label 
                }
            },
            {   $unwind: "$content.images"    },
            {   $unwind: "$content.images.labels"    },
            {
                $match: {
                    "content.images.labels.description": label 
                }
            },
            {
                $group: {
                    _id: "$_id",
                    description: { $first: "$content.images.labels.description" },
                    images: {$push: "$content.images.high_res"},
                    score: { $sum: "$content.images.labels.score"},
                    timestamp: { $first: "$timestamp" },
                    local_id: {$first: "$local_id"}
                }
            },
        ]

    // query to get image count
    const image_count_query = [
        {
            $match: {
                timestamp: {$gt: start_time, $lt: end_time},
                source: "tumblr",
                "content.images.labels.description": label 
            }
        },
        {   $unwind: "$content.images"    },
        {
            $group: {
                _id: "$_id",
                image_count: { $sum: 1},
            }
        },
    ]

    let posts = await collection.aggregate(score_query).toArray();
    let image_counts = await collection.aggregate(image_count_query).toArray();

    for (let i = 0; i < posts.length; i++) {
        const count = image_counts[i].image_count;
        if (count <= 0) {
            posts[i].score = 0
        } else {
            posts[i].score = posts[i].score / count;
        }
    }
    
    // calculate score in different time ranges
    
    let images_over_time = [];
    let curr_time = end_time;

    async function calculateDurationScore(collection, posts, curr_time, duration) {
        const start_bound = curr_time - duration * 0.5;
        const end_bound = curr_time + duration * 0.5;
        const posts_in_time = posts.filter((p)=>{
            return p.timestamp > start_bound && p.timestamp < end_bound;
        })

        const totol_post_count = await collection.find({
            timestamp: {$gt: start_bound, $lt: end_bound}, 
            source:"tumblr"})
            .count();
        
        let score = calculateLabelScore(posts_in_time, totol_post_count);
        if (totol_post_count <= 0) {
            score = 0
        } 
        return score;
    }

    let score_promise = []
    
    while (curr_time > start_time) {
        const score = calculateDurationScore(collection, posts, curr_time, duration);
        score_promise.push(score); 
        curr_time -= duration;
    }

    let score_over_time = await Promise.all(score_promise);

    db.close();

    images_over_time = posts.reduce((memo, post) => {
        return memo.concat(post.images)
    }, [])

    return {
        description: label,
        start_time: start_time,
        end_time: end_time,
        duration: duration,
        scores: score_over_time,
        images: images_over_time.slice(0, 10)
    }
}



async function getOneLabel(id) {
    const db = await MongoClient.connect(configs.DB_URL);
    let video_collection = db.collection(configs.VIDEO_COLLECTION);
    let label_collection = db.collection(configs.LABEL_COLLECTION);

    const oId =  new ObjectId(id)

    const meta = await label_collection.findOne({
        _id: oId
    })
    
    const videos = await label_collection.aggregate([
        {
            $match: { _id: oId}
        },
        {
            
            
            $graphLookup: {
                from: 'video',
                startWith: '$_id',
                connectFromField: 'content.labels.id',
                connectToField: 'content.labels.id',
                as: 'videos',
                maxDepth: 0,
            }
        },
        {
            $unwind: '$videos'
        },
        {
            $project: {
                _id: 0,
                id: "$videos._id",
                href: {
                    $concat: ["https://www.youtube.com/watch?v=", "$videos.local_id" ]
                },
                views: { $literal: 9527 },
                title: '$videos.content.title',
                timestamp: "$videos.timestamp"
            }
        }
    ]).toArray();

    
    
    const labels = await label_collection.aggregate([
        {
            $match: { _id: oId}
        },
        {
            $lookup: {
                from: 'video',
                localField: '_id',
                foreignField: 'content.labels.id',
                as: 'videos',
            }
        },
        {
            $unwind: '$videos'
        },
        {
            $unwind: '$videos.content'
        },
        {
            $unwind: '$videos.content.labels'
        },
        { 
            $match: { 
                'videos.content.labels.id': { $ne: oId } 
            } 
        },
        {
            $group: {
                _id: '$videos.content.labels.id',
                score: {
                    $sum: '$videos.content.labels.score'
                },
                count: { $sum: 1}
            }
        },
        {
            $lookup: {
                from: 'label',
                localField: '_id',
                foreignField: '_id',
                as: 'labels',
            }
        },
        {
            $unwind: '$labels'
        },
        {
            $project: {
                score: 1,
                count: 1,
                id: '$_id',
                _id: 0,
                name: "$labels.name"
            }
        },
        { $sort: { 'score': -1 } }
    ]).toArray();

    let ret;

    if (meta) {
        ret = {
            name: meta.name,
            id: id,
            relations: labels,
            history: {
                grouped_by: "hour",
                videos: utils.groupByHour(videos, configs.SCRAPE_START_TIME)
            }
        }
    } else {
        ret = {}
    }

    return ret
}

async function getOneVideo(id) {
    const db = await MongoClient.connect(configs.DB_URL);
    let video_collection = db.collection(configs.VIDEO_COLLECTION);
    let label_collection = db.collection(configs.LABEL_COLLECTION);

    const oId =  new ObjectId(id)

    const meta = await video_collection.findOne({
        _id: oId
    })

    const labels = await video_collection.aggregate([
        {
            $match: { _id: oId}
        },
        {
            $unwind: "$content"
        },
        {
            $unwind: "$content.labels"
        },
        {
            $lookup: {
                from: 'label',
                localField: 'content.labels.id',
                foreignField: '_id',
                as: 'labels',
            }
        },
        {
            $unwind: "$labels"
        },
        {
            $project: {
                _id: 0,
                id: "$content.labels.id",
                score: "$content.labels.score",
                name: "$labels.name"
            }
        },
        { $sort: { 'score': -1 } }
        
    ]).toArray();


    let ret;

    if (meta) {
        ret = {
            id: id,
            href: `https://www.youtube.com/watch?v=${meta.local_id}`,
            channel: "YouTube",
            views: 9527,
            title: meta.content.title,
            labels: labels,
        }
    } else {
        ret = {};
    }
    return ret

}

async function getLabels() {
    const db = await MongoClient.connect(configs.DB_URL);
    let video_collection = db.collection(configs.VIDEO_COLLECTION);
    let label_collection = db.collection(configs.LABEL_COLLECTION);

    const labels = await label_collection.aggregate([
        {
            $graphLookup: {
                from: 'video',
                startWith: '$_id',
                connectFromField: 'content.labels.id',
                connectToField: 'content.labels.id',
                as: 'videos',
                maxDepth: 0,
            }
        },
        {
            $unwind: '$videos'
        },
        {
            $unwind: '$videos.content'
        },
        {
            $project: {
                name: 1,
                score: {
                    $arrayElemAt: [{
                        $filter: {
                            input: "$videos.content.labels",
                            as: "label",
                            cond: {
                                $eq: ['$$label.id', '$_id']
                            }
                        }
                    }, 0]
                }
            }
        },
        {
            $group: {
                _id: "$_id",
                name: {
                    $first: "$name"
                },
                score: {
                    $sum: "$score.score"
                },
                count: { $sum: 1}
            }
        },
        { $sort: { 'score': -1 } }

    ]).toArray()

    const ret = {
        description: {
            "sorted_by": "popularity",
            "label_count": labels.length,
        },
        data: labels
    }

    return ret;
}

module.exports = {
    getTopTwitterLabels: async (req, res) => {
        const start_time = parseInt(req.body.start_time);
        const end_time = parseInt(req.body.end_time);
        // get label score for each post
        const ret = await queryTopTwitterLabel(start_time, end_time);
        res.send(ret);
    },

    getTopTumblrLabels: async (req, res) => {
        const start_time = parseInt(req.body.start_time);
        const end_time = parseInt(req.body.end_time);
        // get label score for each post
        const ret = await queryTopTumblrLabel(start_time, end_time);
        res.send(ret);
    },
    
    getTwitterLabelScoreOverTime: async(req, res) => {
        const start_time = parseInt(req.body.start_time);
        const end_time = parseInt(req.body.end_time);
        const label = req.body.label.toString();
        const type = req.body.type.toString();
        const duration = parseInt(req.body.duration);
        const ret = await queryTwitterLabelScoresOverTime(label, type, start_time, end_time, duration);
        res.send(ret);
    },

    getTumblrLabelScoreOverTime: async (req, res) => {
        const start_time = parseInt(req.body.start_time);
        const end_time = parseInt(req.body.end_time);
        const label = req.body.label.toString();
        const duration = parseInt(req.body.duration);
        const ret = await queryTumblrLabelScoresOverTime(label, start_time, end_time, duration);
        res.send(ret);
    },

    getPixels: async (req, res) => {
        const curr_time = Math.round(new Date().getTime() / 1000);
        const start_time = parseInt(curr_time-3600*5);
        const end_time = parseInt(curr_time);
        const label = 'overwatch';
        const duration = 1200;
        const ret = await queryPixel(label, start_time, end_time, duration);
        res.render('pixel', {pixels: ret});
    },

    getOneLabel: async (req, res) => {
        const ret = await getOneLabel(req.params.id)
        res.send(ret);
    },

    getOneVideo: async (req, res) => {
        const ret = await getOneVideo(req.params.id)
        res.send(ret);
    },

    getLabels: async (req, res) => {
        const ret = await getLabels()
        res.send(ret);
    }
}