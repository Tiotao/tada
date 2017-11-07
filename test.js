const configs = require('./configs');
const utils = require('./utils/scrape-utils');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

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
                video_id: '$videos._id',
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
                videos: { $push: "$video_id" }
                
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

    console.log(labels);

    if (cache_collection) {
        await cache_collection.remove();
    }
    await cache_collection.insertMany(labels);
    db.close();
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

    // get videos
    let video_ids = await cache_collection.aggregate([
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
    ]).toArray();
    
    video_ids = video_ids[0].common;

    let videos = await video_collection.aggregate([
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

    ]).toArray();


    // post date

    result = {}
    
    videos.map((v)=>{
        result[v._id.toString()] = {}
        configs.AXIS_DURATION.map((d)=>{
            result[v._id.toString()][d] = [];
        })
    })

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
                    result[v._id.toString()][duration].push([view_count_groups.length-i, j])
                }
            }

            let vl_ratio_groups = groups.map((window)=>{
                return window.sort((a, b)=>{return a.stats.vl_ratio > b.stats.vl_ratio})
            })

            
            for (let i = 0; i < vl_ratio_groups.length; i++) {
                for(let j = 0; j < vl_ratio_groups[i].length; j++) {
                    let v = vl_ratio_groups[i][j]
                    result[v._id.toString()][duration].push([vl_ratio_groups.length-i, j])
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

// cacheLabels();

labels = [
  "59e1570ec7e0c22a00d7648e",
  "59e92e81dc4aaf47c4e09871",
//   "59e92fb4dc4aaf47c4e09872",
]

console.log(graphQuery(labels, [0, Infinity], [0, 1]));
