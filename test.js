const configs = require('./configs');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const utils = require('./utils/scrape-utils');

async function cacheLabels() {
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

    ]).toArray()

    console.log(labels);

    await cache_collection.remove();
    await cache_collection.insertMany(labels);
    db.close();
}

cacheLabels();