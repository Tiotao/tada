const configs = require('./configs');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const utils = require('./utils/scrape-utils');


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

    
    const ret = {
        id: id,
        href: `https://www.youtube.com/watch?v=${meta.local_id}`,
        channel: "YouTube",
        views: 9527,
        title: meta.content.title,
        labels: labels,
    }

    return ret

}

getOneVideo("59e127003e41195524488168");

