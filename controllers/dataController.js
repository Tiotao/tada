const _ = require('underscore');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const config = require('config');
const logger  = require('logger').createLogger();
const utils = require('../utils/scrape-utils');
logger.setLevel(config.get('Logger.level'));

async function getOneLabel(id) {
    const db = await MongoClient.connect(config.get("Database.url"));
    let video_collection = db.collection(config.get("Database.video_collection"));
    let label_collection = db.collection(config.get("Database.label_collection"));
    let meta_label_collection = db.collection(config.get("Database.meta_label_collection"));

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
                videos: utils.groupByDuration(videos, !config.has("Scraper.end_time"), (3600*24, config.get("Scraper.max_time_range"))).map((d)=>{return d.length})
            }
        }
    } else {
        ret = {}
    }
    db.close();
    return ret
}

async function getOneVideo(id) {
    const db = await MongoClient.connect(config.get("Database.url"));
    let video_collection = db.collection(config.get("Database.video_collection"));
    let label_collection = db.collection(config.get("Database.label_collection"));

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
    const db = await MongoClient.connect(config.get("Database.url"));
    let cache_collection = db.collection(config.get("Database.cache_collection"));

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
    logger.info("start caching")
    console.time("CACHING");
    const db = await MongoClient.connect(config.get("Database.url"), {
        connectTimeoutMS: 1000000,
        socketTimeoutMS: 1000000,
    });
    
    logger.debug("db connected.")
    let label_collection = db.collection(config.get("Database.label_collection"));
    let cache_collection = db.collection(config.get("Database.cache_collection"));
    let video_collection = db.collection(config.get("Database.video_collection"));
    let stats_collection = db.collection(config.get("Database.stats_collection"));

    let curr_day;
    if (config.get("Scraper.schedule_scraping") || !config.has("Scraper.end_time")) {
        curr_day = utils.normalizeDay(Date.now()/1000)+86400;
    } else {
        curr_day = utils.normalizeDay(config.get("Scraper.end_time"));
    }
    const cache_start_time = curr_day - 2592000;

    // calculating shared stats.

    logger.info('caching shared stats...')

    let top_view_video = await video_collection.find({
        "timestamp": {
            $gt: cache_start_time
        },
    }).sort({
        "stats.view_count": -1
    }).limit(1).toArray();

    top_view_video = top_view_video[0];

    if (stats_collection) {
        await stats_collection.remove();
    }

    await stats_collection.insertOne({
        max_view: top_view_video.stats.view_count
    });
    
    logger.info('caching individual stats...')

    let labels = await label_collection.aggregate([
        {
            $graphLookup: {
                from: 'video',
                startWith: '$_id',
                connectFromField: 'content.labels.id',
                connectToField: 'content.labels.id',
                as: 'videos',
                maxDepth: 0
            }
        },
        {
            $unwind: '$videos'
        },
        {
            $match: {
                "videos.timestamp": {
                    $gt: cache_start_time
                }
            }
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
        { $sort: { 'count': -1 } }

    ]).toArray();

    logger.debug("label queried")

    labels.map((label)=>{
        let now;
        if (config.get("Scraper.schedule_scraping") || !config.has("Scraper.end_time")) {
            now = utils.normalizeDay(Date.now()/1000)+86400;
        } else {
            now = config.get("Scraper.end_time")
        }
        const counts = utils.groupByDay(label.videos, now, 30, (d)=>{return d.timestamp}).map((d)=>{return d.length});
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
    console.timeEnd("CACHING");
    logger.info("finish caching")
}

async function createMetaLabel(name) {
    const db = await MongoClient.connect(config.get("Database.url"));
    let meta_label_collection = db.collection(config.get("Database.meta_label_collection"));
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
        const db = await MongoClient.connect(config.get("Database.url"));
        let meta_label_collection = db.collection(config.get("Database.meta_label_collection"));

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
        const db = await MongoClient.connect(config.get("Database.url"));
        const meta_label_collection = db.collection(config.get("Database.meta_label_collection"));
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
        const db = await MongoClient.connect(config.get("Database.url"));
        const meta_label_collection = db.collection(config.get("Database.meta_label_collection"));
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
        const db = await MongoClient.connect(config.get("Database.url"));
        const label_collection = db.collection(config.get("Database.label_collection"));
        const meta_label_collection = db.collection(config.get("Database.meta_label_collection"));

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
        const db = await MongoClient.connect(config.get("Database.url"));
        const label_collection = db.collection(config.get("Database.label_collection"));
        const meta_label_collection = db.collection(config.get("Database.meta_label_collection"));
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
        const db = await MongoClient.connect(config.get("Database.url"));
        const meta_label_collection = db.collection(config.get("Database.meta_label_collection"));
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

    const db = await MongoClient.connect(config.get("Database.url"));
    let cache_collection = db.collection(config.get("Database.cache_collection"));
    let video_collection = db.collection(config.get("Database.video_collection"));
    let stats_collection = db.collection(config.get("Database.stats_collection"));

    if (!view_count_range) {
        view_count_range = [0, 100];
    }

    const shared_stats = await stats_collection.find({}).toArray();
    const max_view = shared_stats[0].max_view

    console.log(max_view);

    view_count_range = view_count_range.map((r)=>{return r*max_view/100});

    if (!vl_ratio_range) {
        vl_ratio_range = [0, 100];
    }

    vl_ratio_range = vl_ratio_range.map((r)=>{return r/100});

    console.log(vl_ratio_range, view_count_range)

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
    
    let x_axis_key_functions = [
        (v)=>{return v.timestamp},
        (v)=>{ if (v.stats && v.stats.last_mention) {
            return v.stats.last_mention.timestamp;
        } else {
            return -1;
        }}
    ]

    function calcDotsPosition(keyFunc, y_id) {

        const day = 86400;

        if (config.get("Scraper.schedule_scraping") || !config.has("Scraper.end_time")) {
            end_time = new Date() / 1000;
        }

        end_time = utils.normalizeDay(end_time) + day;

        let groups = utils.groupByDay(videos, end_time, 30, keyFunc);

        groups = groups.map((by_day, index)=>{
            let combine = [by_day]
            let by_hour = utils.groupByHour(by_day, end_time - index*day, 24, keyFunc)
            combine.push(by_hour);
            // console.log(acc, by_day);
            return combine;
        })

        function findIndex(sorted_groups, x_id) {
            for (let i = 0; i < sorted_groups.length; i++) {
                // every video
                for (let j = 0; j < sorted_groups[i][0].length; j++) {
                    let v = sorted_groups[i][0][j];
                    const vid = v._id.toString();
                    if (!(vid in result)) {
                        result[vid] = {
                            "heatmap": [v.stats.heatmap.view, v.stats.heatmap.vl_ratio],
                            "3600": [null, null, null, null],
                            "86400": [null, null, null, null]
                        }
                    }

                    // reverse the graph
                    result[vid]["86400"][x_id] = [sorted_groups.length-i-1, j];
                    
                }
                // every hour
                for (let k = 0; k < sorted_groups[i][1].length; k++) {
                    // every video
                    for (let p = 0; p < sorted_groups[i][1][k].length; p++) {
                        let v = sorted_groups[i][1][k][p];
                        const vid = v._id.toString();
                        // reverse graph
                        result[vid]["3600"][x_id] = [sorted_groups[i][1].length-k-1, p];
                    }
                }
            }
        }

        // sort by view count
        
        const groups_by_views = groups.map((g)=>{
            const byViewCount = (a, b)=>{return a.stats.view_count > b.stats.view_count};
            r = []
            r.push(g[0].sort(byViewCount));
            r.push(g[1].map((h)=>{
                h.sort(byViewCount)
                return h;
            }))
            return r;
        })

        findIndex(groups_by_views, y_id * 2 + 0);

        const groups_by_vlr = groups.map((g)=>{
            const byViewLikeRatio = (a, b)=>{return a.stats.vl_ratio > b.stats.vl_ratio};
            r = []
            r.push(g[0].sort(byViewLikeRatio));
            r.push(g[1].map((h)=>{
                h.sort(byViewLikeRatio)
                return h;
            }))
            return r;
        })

        findIndex(groups_by_vlr, y_id * 2 + 1);
        
        

    }

    x_axis_key_functions.map(calcDotsPosition);
    
    const ret = {
        total: videos.length,
        positions: result
    }
    
    return ret
}

async function getFilterGraph() {
    const db = await MongoClient.connect(config.get("Database.url"));
    const video_collection = db.collection(config.get("Database.video_collection"));
    const stats_collection = db.collection(config.get("Database.stats_collection"));

    
    
    logger.debug("db connected.")

    const shared_stats = await stats_collection.find().limit(1).toArray();
    const max_view = shared_stats[0].max_view;

    let curr_day;
    if (config.get("Scraper.schedule_scraping") || !config.has("Scraper.end_time")) {
        curr_day = utils.normalizeDay(Date.now()/1000)+86400;
    } else {
        curr_day = utils.normalizeDay(config.get("Scraper.end_time"));
    }

    const cache_start_time = curr_day - 2592000;
    // console.log(cache_start_time);
    
    let videos = await video_collection.aggregate([
        {
            $match: {
                "timestamp": {
                    $gt: cache_start_time
                }
            }
        }, 
        {
            $project: {
                "stats.view_count": 1,
                "stats.vl_ratio": 1
            }
        }
    ]).toArray();

    let view_like_group = utils.groupByViewLikeRatio(videos).map((group)=>{ return group.length;});

    let view_count_group = utils.groupByViewCount(videos, max_view).map((group)=>{ return group.length;});

    db.close();
    logger.info("finish caching")

    const ret = {
        view: view_count_group.reverse(),
        vl_ratio: view_like_group.reverse(),
    }

    return ret

}

module.exports = {

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

    getFilterGraph: async(req, res) => {
        const ret = await getFilterGraph()
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