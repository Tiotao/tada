const MongoClient = require('mongodb').MongoClient;
const configs = require('../configs');
const _ = require('underscore');
const nodeUtil = require('util');
const visionCtrl = require('./visionController');
const languageCtrl = require('./languageController');
const google = require('googleapis');
const YouTubeClient = google.youtube({
    version: 'v3',
    auth: configs.YOUTUBE_API_KEY
 });

const YouTubeGetStats = nodeUtil.promisify(YouTubeClient.videos.list.bind(YouTubeClient.videos))
const YouTubeGetRecent = nodeUtil.promisify(YouTubeClient.search.list.bind(YouTubeClient.search))

const logger  = require('logger').createLogger();
const utils = require('../utils/scrape-utils');
const natural = require('natural');
const parallel = require('async-await-parallel');
logger.setLevel(configs.LOGGER_LEVEL);

async function getListOfVideos(query, method) {
    logger.info('labelling', 'recent', 'posts from:', query);

    function formatVideo(video, method) {
        let formatted_video = {};
        formatted_video = {
            content: {
                title: video.snippet.title,
                // images: times,
                text: video.snippet.description,
            },
            source: "youtube",
            media_type: "video",
            search_ref: [{
                keyword: query,
                type: 'recent',
            }],
            local_id: video.id.videoId || video.id,
            author: video.snippet.channelTitle,
            timestamp: new Date(video.snippet.publishedAt).getTime() / 1000
        }
        if (method == "id") {
            let mention = query.mentions[video.id]
            let vl_ratio = video.statistics.likeCount / video.statistics.viewCount;
            if (!vl_ratio) {
                vl_ratio = 0;
            }
            formatted_video.stats = {
                "view_count": parseInt(video.statistics.viewCount),
                "like_count": parseInt(video.statistics.likeCount),
                "dislike_count": parseInt(video.statistics.dislikeCount),
                "fav_count": parseInt(video.statistics.favoriteCount),
                "comment_count": parseInt(video.statistics.commentCount),
                "vl_ratio": vl_ratio,
                "last_mention": {
                    "timestamp": mention.timestamp,
                    'source': mention.source,
                    "source_id": mention.source_id
                }
            };
            formatted_video.search_ref = [{
                keyword: query,
                type: 'twitter_mention',
            }];
        }
        return formatted_video;
    }

    function videoToDict(dict, video) {
        dict[video.local_id] = video;
        return dict;
    }

    function appendStats(dict, vs) {
        let vl_ratio = vs.statistics.likeCount / vs.statistics.viewCount;
        if (!vl_ratio) {
            vl_ratio = 0;
        }
        dict[vs.id].stats =  {
            "view_count": parseInt(vs.statistics.viewCount),
            "like_count": parseInt(vs.statistics.likeCount),
            "dislike_count": parseInt(vs.statistics.dislikeCount),
            "fav_count": parseInt(vs.statistics.favoriteCount),
            "comment_count": parseInt(vs.statistics.commentCount),
            "vl_ratio": vl_ratio
        }
        return dict;
    }

    try {
        let response;
        if (method == "keyword") {
            response = await YouTubeGetRecent({
                "part": "snippet",
                "q": query,
                "type": "video",
                "maxResults": 50,
                "order": "date"
            })
        } else {
            response = await YouTubeGetStats({
                "part": "snippet, statistics",
                "id": query.ids.join(','),
            })

        }

        let videos = response.items.map((v)=>{ 
            return formatVideo(v, method)
        });

        if (method == "id") {
            return videos;
        }
        
        let videos_dict = videos.reduce(videoToDict, {});
        const video_stats = await scrapeStats(videos);
        videos_dict = video_stats.reduce(appendStats, videos_dict);
        videos = _.values(videos_dict);
        return videos;

    } catch (err) {
        logger.error(err);
        return []
    }
}

async function scrapeKeyword(video_collection, keyword) {
    
    let raw_video_list = await getListOfVideos(keyword, "keyword");
    let video_list = []

    async function ignoreExistingVideos(video) {
        const post_exists = await video_collection.find({source:"youtube", local_id: video.local_id}).count() > 0;
        if (!post_exists) {
            video_list.push(video);
        }
        return;
    }

    let ret;

    try {
        let unique_promises = raw_video_list.map(ignoreExistingVideos)
        await Promise.all(unique_promises); 
        let videos = video_list;
        ret = videos;
    } catch (err) {
        logger.error(err);
        ret = [];
    }

    return ret;
}

async function scrape(mentions) {
    
    logger.info('start scarpping youtube recent posts...');
    const keywords = configs.YOUTUBE_SEARCH_KEYWORDS;
    try {
        logger.info('connecting to database...');
        const db = await MongoClient.connect(configs.DB_URL);
        let video_collection = db.collection(configs.VIDEO_COLLECTION);
        let label_collection = db.collection(configs.LABEL_COLLECTION);
        let promises;

        if (mentions) {
            logger.info('start scarpping youtube video with id');
            promises = [await getListOfVideos(mentions, "id")]
        } else {
            promises = keywords.map(async (keyword) => {
                return await scrapeKeyword(video_collection, keyword)
            })
        }

        let videos = await Promise.all(promises);

        

        videos = utils.combineDuplicates(videos);

        // label title
        let labelled_videos = await languageCtrl.label(videos, false);

        async function convertEntityToLabel(entities) {
            const id_promises = entities.map(async (entity) => {

                let label_name = natural.PorterStemmer.stem(entity.name);
                
                const label = await label_collection.findOne({name: label_name});
                
                if (label) {
                    return {
                        id: label._id,
                        score: entity.salience
                    };
                } else {
                    const inserted = await label_collection.insertOne({name: label_name})
                    logger.debug("label not found, create a new label: " + label_name + " with id: " + inserted.insertedId);
                    return {
                        id: inserted.insertedId,
                        score: entity.salience
                    };
                }
            })

            const label_ids = await Promise.all(id_promises);

            return label_ids;
        }

        for (let i = 0; i < labelled_videos.length; i++) {
            let video = labelled_videos[i];
            const label_ids = await convertEntityToLabel(video.content.entities);
            video.content.labels = label_ids;
            delete video.content.entities;
            labelled_videos[i] = video;
        }

        // add into databse
        if(labelled_videos.length === 0) {
            logger.info('no change to database.'); 
            db.close();
            return;
        }
   
        await video_collection.insert(labelled_videos);
        logger.info('database updated with', labelled_videos.length, 'posts.');
        db.close();
        return labelled_videos;

    } catch (err) {
        logger.error(err);
        return err;
    }
}

async function scrapeStats(query_videos) {
    try {
        console.time("SCRAPE_STATS");
        logger.info('scrapping stats of youtube video...')
        logger.info('connecting to database...');
        const db = await MongoClient.connect(configs.DB_URL);
        let video_collection = db.collection(configs.VIDEO_COLLECTION);
        let videos;

        if (!query_videos) {
            videos = await video_collection.aggregate(
                [
                    {
                        $project: {
                            _id: 0,
                            local_id: 1
                        }
                    }
                ]
            ).toArray();
        } else {
            videos = query_videos;
        }
        
        const video_ids = videos.reduce((ids, v)=>{
            ids.push(v.local_id);
            return ids
        }, []);

        // split ids into chunks
        const call_chunks = 50
        let stats_promises = [];
        for (let i = 0; i < video_ids.length; i+= call_chunks) {
            let ids = video_ids.slice(i, i+call_chunks);
            stats_promises.push(async()=>{
                return await YouTubeGetStats({
                    part: 'statistics',
                    id: ids.join(',')
                })
            })
        }

        const response = await parallel(stats_promises, 100);

        const video_stats = response.reduce((stats, res)=>{
            stats.push.apply(stats, res.items);
            return stats;
        }, [])

        if (query_videos) {
            return video_stats;
        }
        
        let update_promises = video_stats.map((vs) => {
            return async() => {
                let vl_ratio = vs.statistics.likeCount / vs.statistics.viewCount;
                if (!vl_ratio) {
                    vl_ratio = 0;
                }
                await video_collection.findOneAndUpdate({
                    "local_id": vs.id
                }, {
                    $set: {
                        "stats.view_count": parseInt(vs.statistics.viewCount),
                        "stats.like_count": parseInt(vs.statistics.likeCount),
                        "stats.dislike_count": parseInt(vs.statistics.dislikeCount),
                        "stats.fav_count": parseInt(vs.statistics.favoriteCount),
                        "stats.comment_count": parseInt(vs.statistics.commentCount),
                        "stats.vl_ratio": vl_ratio
                    }
                })
            }
        })

        await parallel(update_promises, 100);
        
        logger.info(`Out of ${video_ids.length} videos, ${update_promises.length} videos' stats updated. `)

        console.timeEnd("SCRAPE_STATS");

    } catch (err) {
        logger.error(err);
        return [];
        // await browser.close();
    }

}


module.exports = {
    scrape: async (req, res) => {
        const ret = await scrape();
        res.send(ret);
    },

    scrapeStatsAPI: async(req, res)=>{
        await scrapeStats();
        res.sendStatus(200);
    },

    scrapeStats: scrapeStats,
    getListOfVideos: getListOfVideos,
    scheduleScraping: scrape,

}