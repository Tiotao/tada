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
    let meta_label_collection = db.collection(configs.META_LABEL_COLLECTION);

    const query_oid =  new ObjectId(id)

    const meta = await meta_label_collection.findOne({
        _id: query_oid
    })

    const regular = await label_collection.findOne({
        _id: query_oid
    })

    let label_oids, query_label

    if (meta) {
        label_oids = meta.labels;
        query_label = meta;
    } else {
        label_oids = [query_oid];
        query_label = regular;
    }
    
    const videos = await label_collection.aggregate([
        {
            $match: { _id: { $in: label_oids} }
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
                stats:'$videos.stats',
                title: '$videos.content.title',
                timestamp: "$videos.timestamp",
                labels: "$videos.content.labels.id"
            }
        }
    ]).toArray();
    
    const labels = await label_collection.aggregate([
        {
            $match: { _id: { $in: label_oids} }
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
                'videos.content.labels.id': { $nin: label_oids } 
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
                name: "$labels.name"
            }
        },
        {
            $lookup: {
                from: 'meta_label',
                localField: '_id',
                foreignField: 'labels',
                as: 'meta_label'
            }
        },
        { $unwind: { "path": "$meta_label", "preserveNullAndEmptyArrays": true }},
        {
            $project: {
                meta_id: {
                    $cond: [
                        { $not: "$meta_label" },
                        "$_id",
                        "$meta_label._id"
                    ]
                },
                is_meta: {
                    $cond: [
                        { $not: "$meta_label" },
                        false,
                        true
                    ]
                },
                name: {
                    $cond: [
                        { $not: "$meta_label" },
                        "$name",
                        "$meta_label.name"
                    ]
                },
                score: 1,
                count: 1
            }
        },
        {
            $group: {
                _id: "$meta_id",
                name: {
                    $first: "$name"
                },
                is_meta: {
                    $first: "$is_meta"
                },
                score: {
                    $sum: "$score"
                },
                count: { $sum: "$count"}
            }
        },
        { $sort: { 'score': -1 } }
    ]).toArray();

    let ret;

    if (query_label) {
        ret = {
            name: query_label.name,
            id: id,
            relations: labels,
            history: {
                grouped_by: "day",
                videos: utils.groupByDuration(videos, configs.SCHEDULE_SCRAPE, 3600*24).map((d)=>{return d.length})
            }
        }
    } else {
        ret = {}
    }
    db.close();
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
                _id: "$content.labels.id",
                score: "$content.labels.score",
                name: "$labels.name"
            }
        },
        {
            $lookup: {
                from: 'meta_label',
                localField: '_id',
                foreignField: 'labels',
                as: 'meta_label'
            }
        },
        { $unwind: { "path": "$meta_label", "preserveNullAndEmptyArrays": true }},
        {
            $project: {
                meta_id: {
                    $cond: [
                        { $not: "$meta_label" },
                        "$_id",
                        "$meta_label._id"
                    ]
                },
                is_meta: {
                    $cond: [
                        { $not: "$meta_label" },
                        false,
                        true
                    ]
                },
                name: {
                    $cond: [
                        { $not: "$meta_label" },
                        "$name",
                        "$meta_label.name"
                    ]
                },
                score: 1,
                count: 1
            }
        },
        {
            $group: {
                _id: "$meta_id",
                name: {
                    $first: "$name"
                },
                is_meta: {
                    $first: "$is_meta"
                },
                score: {
                    $sum: "$score"
                },
                count: { $sum: "$count"}
            }
        },
        { $sort: { 'score': -1 } }
        
    ]).toArray();

    db.close();
    let ret;

    if (meta) {
        ret = {
            id: id,
            href: `https://www.youtube.com/watch?v=${meta.local_id}`,
            channel: "YouTube",
            stats: meta.stats,
            title: meta.content.title,
            description: meta.content.text,
            timestamp: meta.timestamp,
            labels: labels,
            thumbnail: `http://img.youtube.com/vi/${meta.local_id}/mqdefault.jpg`
        }
    } else {
        ret = {};
    }

    
    return ret

}

async function getLabels() {
    const db = await MongoClient.connect(configs.DB_URL);
    let cache_collection = db.collection(configs.LABEL_CACHE_COLLECTION);

    const labels = await cache_collection.find({
        $query: {},
        $orderby: { score: -1 }
    }).toArray();
    

    const ret = {
        description: {
            "sorted_by": "popularity",
            "label_count": labels.length,
        },
        data: labels
    }

    return ret;
}

async function cacheLabels() {
    logger.info("start cacheing")
    const db = await MongoClient.connect(configs.DB_URL);
    let label_collection = db.collection(configs.LABEL_COLLECTION);
    let cache_collection = db.collection(configs.LABEL_CACHE_COLLECTION);

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
                video: {
                    id: '$videos._id',
                    timestamp: '$videos.timestamp',
                },
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
                videos: { $push: "$video" }
                
            }
        },
        {
            $lookup: {
                from: 'meta_label',
                localField: '_id',
                foreignField: 'labels',
                as: 'meta_label'
            }
        },
        { $unwind: { "path": "$meta_label", "preserveNullAndEmptyArrays": true }},
        {
            $project: {
                meta_id: {
                    $cond: [
                        { $not: "$meta_label" },
                        "$_id",
                        "$meta_label._id"
                    ]
                },
                is_meta: {
                    $cond: [
                        { $not: "$meta_label" },
                        false,
                        true
                    ]
                },
                name: {
                    $cond: [
                        { $not: "$meta_label" },
                        "$name",
                        "$meta_label.name"
                    ]
                },
                score: 1,
                videos: 1,
            }
        },
        { $unwind: { "path": "$videos", "preserveNullAndEmptyArrays": true }},
        {
            $group: {
                _id: "$meta_id",
                name: {
                    $first: "$name"
                },
                is_meta: {
                    $first: "$is_meta"
                },
                score: {
                    $sum: "$score"
                },
                count: { $sum: 1 },
                videos: { $push: "$videos" },
            }
        },
        { $sort: { 'score': -1 } }

    ]).toArray()

    labels.map((label)=>{
        let counts = utils.groupByDuration(label.videos, configs.SCHEDULE_SCRAPE, 3600*24).map((d)=>{return d.length})
        label.history = counts.reverse();
        return label
    })

    labels.map((label)=>{
        let videos = label.videos.map((v)=>{return v.id})
        label.videos = videos;
        return label
    })

    if (cache_collection) {
        await cache_collection.remove();
    }
    await cache_collection.insertMany(labels);
    db.close();
}


async function createMetaLabel(name) {
    const db = await MongoClient.connect(configs.DB_URL);
    let meta_label_collection = db.collection(configs.META_LABEL_COLLECTION);
    const label = await meta_label_collection.findOne({name: name, labels:[]});

    try {
        if (!label) {
            const inserted = await meta_label_collection.insertOne({name: name});
            db.close();
            return {
                status: "success",
                value: {
                    id: inserted.insertedId,
                    name: name
                }
            }
        } else {
            db.close();
            return {
                status: "duplication",
                value: {
                    id: label._id,
                    name: name
                }
            }
        }
    } catch(e) {
        return {
            status: "fail",
            value: e
        }
    }
}

async function deleteMetaLabel(id) {
    try {
        const db = await MongoClient.connect(configs.DB_URL);
        let meta_label_collection = db.collection(configs.META_LABEL_COLLECTION);

        await meta_label_collection.remove({_id: ObjectId(id)});
        db.close();
        return {
            status: "success"
        }
        
    } catch (e) {
        return {
            status: "fail",
            value: e
        }
    }

}

async function assignLabel(meta_label_id, id) {
    try {
        const db = await MongoClient.connect(configs.DB_URL);
        const meta_label_collection = db.collection(configs.META_LABEL_COLLECTION);
        await meta_label_collection.update(
            { _id: ObjectId(meta_label_id) },
            { $push: { 'labels': ObjectId(id) } }
        )
        db.close();
        return  {
            status: "success"
        }
    } catch (e) {
        return {
            status: "fail",
            value: e
        }
    }
}

async function unassignLabel(meta_label_id, id) {
    try {
        const db = await MongoClient.connect(configs.DB_URL);
        const meta_label_collection = db.collection(configs.META_LABEL_COLLECTION);
        await meta_label_collection.update(
            { _id: ObjectId(meta_label_id) },
            { $pull: { 'labels': ObjectId(id) } }
        )
        db.close();
        return  {
            status: "success"
        }
    } catch (e) {
        return {
            status: "fail",
            value: e
        }
    }
}

async function getAssignedLabel(meta_label_id) {
    try {
        const db = await MongoClient.connect(configs.DB_URL);
        const label_collection = db.collection(configs.LABEL_COLLECTION);
        const meta_label_collection = db.collection(configs.META_LABEL_COLLECTION);

        const labels = await meta_label_collection.aggregate([
            {
                $match: {
                    _id: ObjectId(meta_label_id)
                }
            },
            {
                $unwind: "$labels"
            },
            {
                $lookup: {
                    from: 'label',
                    localField: 'labels',
                    foreignField: '_id',
                    as: 'labels_data',
                }
            },
            {
                $unwind: "$labels_data"
            },
            {
                $group:{ _id: "$_id", l: {$push : "$labels_data"} }
            },
            {
                $project:{ _id:0, labels_data: "$l"}
            }
        ]).toArray();
        return  {
            status: "success",
            value: labels[0].labels_data
        }
    } catch (e) {
        return {
            status: "fail",
            value: e
        }
    }
}

async function getUnassignedLabels() {
    try {
        const db = await MongoClient.connect(configs.DB_URL);
        const label_collection = db.collection(configs.LABEL_COLLECTION);
        const meta_label_collection = db.collection(configs.META_LABEL_COLLECTION);
        const labels = await label_collection.aggregate([
            {
                $lookup: {
                    from: 'meta_label',
                    localField: '_id',
                    foreignField: 'labels',
                    as: 'meta_label',
                }
            },
            {
                $project: {
                    name: 1,
                    meta_label_count: {$size: "$meta_label"}
                }
            },
            {
                $match: {
                    "meta_label_count": {$eq: 0}
                }
            },
            {
                $project: {
                    name: 1,
                }
            },
        ]).toArray();
        db.close();
        return {
            status: "success",
            value: labels
        }
    } catch (e) {
        return {
            status: "fail",
            value: e
        }
    }
    
}


async function getMetaLabels() {
    try {
        const db = await MongoClient.connect(configs.DB_URL);
        const meta_label_collection = db.collection(configs.META_LABEL_COLLECTION);
        const meta_labels = await meta_label_collection.find({}).toArray();
        db.close();
        return {
            status: "success",
            value: meta_labels
        }
    } catch (e) {
        return {
            status: "fail",
            value: e
        }
    }
}

async function graphQuery(label_ids, view_count_range, vl_ratio_range) {

    const db = await MongoClient.connect(configs.DB_URL);
    let cache_collection = db.collection(configs.LABEL_CACHE_COLLECTION);
    let video_collection = db.collection(configs.VIDEO_COLLECTION);

    if (!view_count_range) {
        view_count_range = [0, Infinity];
    }

    if (!vl_ratio_range) {
        vl_ratio_range = [0, 1];
    }

    label_ids = label_ids.map((id)=>{return new ObjectId(id)});

    let id_query = [
        {
            $match: {
                _id: { $in: label_ids }
            }
        },
        {
            $group: {
                _id: 0,
                sets: { $push: "$videos" },
                init: { $first: "$videos" }
            }
        },
        {
            $project: {
                "common": {
                    $reduce: {
                        "input": "$sets",
                        "initialValue": "$init",
                        "in": { $setIntersection: ["$$value", "$$this"] }
                    }
                }
            }
        }
    ]

    let video_ids;

    if (label_ids.length > 0) {
        video_ids = await cache_collection.aggregate(id_query).toArray();
        video_ids = video_ids[0].common;
    } else{
        video_ids = []
    }

    let video_query = [
        {
            $match: {
                _id: {$in: video_ids},
                "stats.view_count": {
                    $gt: view_count_range[0],
                    $lt: view_count_range[1],
                },
                "stats.vl_ratio": {
                    $gt: vl_ratio_range[0],
                    $lt: vl_ratio_range[1],
                }
            }
        },
        {
            $project: {
                local_id: 1,
                timestamp: 1,
                stats: 1
            }
        }

    ]

    // get videos
    
    if (label_ids.length === 0) {
        video_query[0].$match = {
            "stats.view_count": {
                $gt: view_count_range[0],
                $lt: view_count_range[1],
            },
            "stats.vl_ratio": {
                $gt: vl_ratio_range[0],
                $lt: vl_ratio_range[1],
            }
        }
    }

    let videos = await video_collection.aggregate(video_query).toArray();


    // post date

    result = {}
    
    

    // videos.map((v)=>{
    //     result[v._id.toString()] = {}
    //     configs.AXIS_DURATION.map((d)=>{
    //         result[v._id.toString()][d] = [];
    //     })
    // })

    console.log(videos.length);

    let x_axis_key_functions = [
        (v)=>{return v.timestamp},
        (v)=>{return v.timestamp}
    ]

    function calcDotsPosition(keyFunc) {
        configs.AXIS_DURATION.map((duration)=>{

            let groups = utils.groupByDuration(videos, configs.SCHEDULE_SCRAPE, duration, (v)=>{return v.timestamp});

            let view_count_groups = groups.map((window)=>{
                return window.sort((a, b)=>{return a.stats.view_count > b.stats.view_count})
            })

            for (let i = 0; i < view_count_groups.length; i++) {
                for(let j = 0; j < view_count_groups[i].length; j++) {
                    let v = view_count_groups[i][j]
                    const vid = v._id.toString();
                    if (!(vid in result)) {
                        result[vid] = {}
                        configs.AXIS_DURATION.map((d)=>{
                            result[vid][d] = [];
                        })
                    }
                    result[vid][duration].push([view_count_groups.length-i, j])
                }
            }

            let vl_ratio_groups = groups.map((window)=>{
                return window.sort((a, b)=>{return a.stats.vl_ratio > b.stats.vl_ratio})
            })

            
            for (let i = 0; i < vl_ratio_groups.length; i++) {
                for(let j = 0; j < vl_ratio_groups[i].length; j++) {
                    let v = vl_ratio_groups[i][j];
                    const vid = v._id.toString();
                    if (!(vid in result)) {
                        result[vid] = {}
                        configs.AXIS_DURATION.map((d)=>{
                            result[vid][d] = [];
                        })
                    }
                    result[vid][duration].push([vl_ratio_groups.length-i, j])
                }
            }
        })
    }

    x_axis_key_functions.map(calcDotsPosition);
    // console.log(JSON.stringify(result))
    
    const ret = {
        total: videos.length,
        positions: result
    }
    
    return ret
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
    },

    manageLabels: async(req, res) => {
        res.render('manage/dashboard');
    },

    manageHeatmaps: async(req, res) => {
        res.render('manage/index');
    },

    createMetaLabel: async(req, res) => {
        const ret = await createMetaLabel(req.body.name)
        res.send(ret);
    },

    deleteMetaLabel: async (req, res) => {
        const ret = await deleteMetaLabel(req.body.id)
        res.send(ret);
    },

    assignLabel: async (req, res) => {
        const ret = await assignLabel(req.body.mid, req.body.id)
        res.send(ret);
    },

    unassignLabel: async (req, res) => {
        const ret = await unassignLabel(req.body.mid, req.body.id)
        res.send(ret);
    },

    getMetaLabels: async(req, res) => {
        const ret = await getMetaLabels()
        res.send(ret);
    },

    getUnassignedLabels: async(req, res) => {
        const ret = await getUnassignedLabels();
        res.send(ret);
    },

    getAssignedLabel: async(req, res) => {
        const ret = await getAssignedLabel(req.body.id);
        res.send(ret);
    },

    graphQuery: async(req, res)=>{

        const ids = req.body.ids;
        let view_count_range = req.body.view_count_range;
        let vl_ratio_range = req.body.like_ratio_range;
        
        view_count_range = view_count_range.map(parseFloat);
        vl_ratio_range = vl_ratio_range.map(parseFloat);
        const ret = await graphQuery(ids, view_count_range, vl_ratio_range);

        res.send(ret);
    },

    cacheLabels: cacheLabels

}