const _ = require('underscore');
const MongoClient = require('mongodb').MongoClient;
const configs = require('../configs');
const logger  = require('logger').createLogger();
logger.setLevel(configs.LOGGER_LEVEL);

async function queryTopTumblrLabel(start_time, end_time) {

    let result_score = [];
    
    if (start_time > end_time) {
        return result_score;
    }

    logger.info('connecting to database...');
    const db = await MongoClient.connect(configs.DB_URL);
    let collection = db.collection(configs.DB_COLLECTION);
    let posts = await collection.find({timestamp: {$gt: start_time, $lt: end_time}}).toArray();
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

function calculateLabelScore(entries, count) {
    if (entries.length == 0) {
        return 0
    }
    let score = 0;
    entries.map(function(entry) {
        score += entry.score;
    })

    return score;
}


async function queryLabelScoresOverTime(label, start_time, end_time, duration) {
    logger.info('connecting to database...');
    const db = await MongoClient.connect(configs.DB_URL);
    let collection = db.collection(configs.DB_COLLECTION);
    // query to get score
    const score_query = [
            {
                $match: {
                    timestamp: {$gt: start_time, $lt: end_time},
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
                    score: { $sum: "$content.images.labels.score"},
                    image_count: { $sum: 1},
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
            posts[i].score = posts[i].score / image_counts[i].image_count;
        }
    }
    
    // calculate score in different time ranges
    
    let score_over_time = [];
    let curr_time = end_time;
    
    while (curr_time > start_time) {
        const posts_in_time = posts.filter((p)=>{
            return p.timestamp < curr_time;
        })
        
        const totol_post_count = await collection.find({timestamp: {$gt: start_time, $lt: curr_time}}).count();
        
        curr_time -= duration;
        let score = calculateLabelScore(posts_in_time, totol_post_count) / totol_post_count;
        if (totol_post_count <= 0) {
            score = 0
        } 
        score_over_time.push(score); 
    }

    db.close();

    return {
        description: label,
        start_time: start_time,
        end_time: end_time,
        duration: duration,
        scores: score_over_time
    }
}

module.exports = {
    getTopTumblrLabels: async (req, res) => {
        const start_time = parseInt(req.body.start_time);
        const end_time = parseInt(req.body.end_time);
        // get label score for each post
        const ret = await queryTopTumblrLabel(start_time, end_time);
        res.send(ret);
    },

    getTumblrLabelScoreOverTime: async (req, res) => {
        const start_time = parseInt(req.body.start_time);
        const end_time = parseInt(req.body.end_time);
        const label = req.body.label.toString();
        const duration = parseInt(req.body.duration);
        const ret = await queryLabelScoresOverTime(label, start_time, end_time, duration);
        res.send(ret);
    }
}