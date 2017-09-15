const _ = require('underscore');
const MongoClient = require('mongodb').MongoClient;
const c = require('../constants');
const logger  = require('logger').createLogger();
logger.setLevel(c.LOGGER_LEVEL);

async function queryTopTumblrLabel(start_time, end_time) {

    let result_score = [];
    
    if (start_time > end_time) {
        return result_score;
    }

    logger.info('connecting to database...');
    const db = await MongoClient.connect(c.DB_URL);
    let collection = db.collection('image_posts');
    let posts = await collection.find({timestamp: {$gt: start_time, $lt: end_time}}).toArray();
    

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
                    score: scores[k]
                })
            }
        }

        result_score.sort((a, b)=>{return b.score - a.score;})
        
    } catch (error) {
        logger.error(error);
        result_score = [];
    }

    return result_score;

}

module.exports = {
    getTopTumblrLabels: async (req, res) => {
        const start_time = parseInt(req.params.start);
        const end_time = parseInt(req.params.end);
        // get label score for each post
        const ret = await queryTopTumblrLabel(start_time, end_time);
        res.send(ret);
    }
}