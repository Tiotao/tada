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

    console.log(labels);

    db.close();
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

getOneVideo("59e110f7c8b25a5660ce3313");