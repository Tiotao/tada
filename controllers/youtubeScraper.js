const MongoClient = require('mongodb').MongoClient;
const config = require('config');
const _ = require('underscore');
const nodeUtil = require('util');
const languageCtrl = require('./languageController');
const google = require('googleapis');
const YouTubeClient = google.youtube({
    version: 'v3',
    auth: config.get("Credentials.youtube.api_key")
 });

const YouTubeGetStats = nodeUtil.promisify(YouTubeClient.videos.list.bind(YouTubeClient.videos))
const YouTubeGetRecent = nodeUtil.promisify(YouTubeClient.search.list.bind(YouTubeClient.search))

const logger  = require('logger').createLogger();
logger.setLevel(config.get("Logger.level"));
const utils = require('../utils/scrape-utils');
const natural = require('natural');
const parallel = require('async-await-parallel');

/**
 * Get List of video from YouTube and format to the following format
 * {
 *      content: {
 *          title: string
 *          text: string - description
 *      },
 *      source: "youtube",
 *      media_type: "video",
 *      search_ref: array of search references 
 *                  {keyword: string, type: 'recent'},
 *      entities: {
 *          urls: array of urls mentioned in the tweets
 *          videos: array of videos {id: string, source: 'youtube'}
 *      },
 *      local_id: string - id of the youtube video,
 *      author: string,
 *      timestamp: 10 digit timestamp,
 *      stats: {
 *          view_count: int,
 *          like_count: int,
 *          dislike_count: int,
 *          fav_count: int,
 *          comment_count: int,
 *          vl_ratio: float - like view ratio,
 *          heatmap: {
 *              view: int - heatmap level defined using 
 *                          utils.calculateHeatmapLevel,
 *              vl_ratio: int - heatmap level defined using 
 *                              utils.calculateHeatmapLevel, 
 *          }
 *      }
 * }
 * @param {String} query - keywords/id that are used to query YouTube Video
 * @param {*} method - type of query, eg. "keyword", "id"
 */
async function getListOfVideos(query, method) {
    logger.info('labelling', 'recent', 'posts from:', query);

    const db = await MongoClient.connect(config.get("Database.url"));
    let stats_collection = db.collection(config.get("Database.stats_collection"));
    const shared_stats = await stats_collection.find({}).toArray();
    const max_view = shared_stats[0].max_view;

    // format result from YouTube API
    function formatVideo(video, method, max_view) {
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
        // append stats if query from id
        if (method == "id") {
            let mention = query.mentions[video.id]
            let vl_ratio = video.statistics.likeCount / video.statistics.viewCount;
            if (!vl_ratio) {
                vl_ratio = 0;
            }

            const heatmap_level = utils.calculateHeatmapLevel(video.statistics.viewCount, vl_ratio, max_view);
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
                },
                "heatmap": {
                    "view": heatmap_level[0],
                    "vl_ratio": heatmap_level[1]
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

        const heatmap_level = utils.calculateHeatmapLevel(vs.statistics.viewCount, vl_ratio, max_view);

        dict[vs.id].stats =  {
            "view_count": parseInt(vs.statistics.viewCount),
            "like_count": parseInt(vs.statistics.likeCount),
            "dislike_count": parseInt(vs.statistics.dislikeCount),
            "fav_count": parseInt(vs.statistics.favoriteCount),
            "comment_count": parseInt(vs.statistics.commentCount),
            "vl_ratio": vl_ratio,
            "heatmap": {
                "view": heatmap_level[0],
                "vl_ratio": heatmap_level[1]
            }
        }
        return dict;
    }

    try {
        let response;
        // query youtube video through search keyword, without stats
        if (method == "keyword") {
            response = await YouTubeGetRecent({
                "part": "snippet",
                "q": query,
                "type": "video",
                "maxResults": 50,
                "order": "date"
            })
        // query youtube video through id, with stats
        } else {
            response = await YouTubeGetStats({
                "part": "snippet, statistics",
                "id": query.ids.join(','),
            })

        }
        // format youtube api results into video entry
        let videos = response.items.map((v)=>{ 
            return formatVideo(v, method, max_view)
        });

        if (method == "id") {
            return videos;
        }

        // there is no stats in video entry while query from keyword
        // query additional stats from YouTube API and append to entry
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

/**
 * Scrape video from youtube with keyword
 * @param {Object} video_collection - database collection
 * @param {String} keyword - youtube search keyword
 * @return {Object} video entries defined in getListOfVideos
 */
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

/**
 * Scrape video from YouTube and save to database
 */
async function scrape() {
    
    logger.info('start scarpping youtube recent posts...');
    const keywords = config.get("Scraper.youtube.keywords");

    try {
        logger.info('connecting to database...');
        const db = await MongoClient.connect(config.get("Database.url"));
        let video_collection = db.collection(config.get("Database.video_collection"));
        let label_collection = db.collection(config.get("Database.label_collection"));

        let promises = keywords.map(async (keyword) => {
            return await scrapeKeyword(video_collection, keyword)
        })

        let videos = await Promise.all(promises);
        videos = utils.combineDuplicates(videos);

        // label title and description
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
        return;

    } catch (err) {
        logger.error(err);
        return;
    }
}

/**
 * Update selected video's stats from YouTube
 * @param {Array<Object>} query_videos - video entries from database
 *                                       if null, all videos
 */
async function scrapeStats(query_videos) {
    try {
        console.time("SCRAPE_STATS");
        logger.info('scrapping stats of youtube video...')
        logger.info('connecting to database...');
        const db = await MongoClient.connect(config.get("Database.url"));
        let video_collection = db.collection(config.get("Database.video_collection"));
        let stats_collection = db.collection(config.get("Database.stats_collection"));

        const shared_stats = await stats_collection.find({}).toArray();
        const max_view = shared_stats[0].max_view;

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

        const video_stats_ids = video_stats.map((vs) => {
            return vs.id;
        })

        let remove_ids = video_ids.filter(x=>video_stats_ids.indexOf(x)==-1);

        await video_collection.remove({
            "local_id": { "$in": remove_ids }
        })

        logger.info(`${remove_ids.length} videos deleted as they are no longer existed.`)
        
        let update_promises = video_stats.map((vs) => {
            return async() => {
                let vl_ratio = vs.statistics.likeCount / vs.statistics.viewCount;
                const heatmap_level = utils.calculateHeatmapLevel(vs.statistics.viewCount, vl_ratio, max_view);
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
                        "stats.vl_ratio": vl_ratio,
                        "stats.heatmap": {
                            "view": heatmap_level[0],
                            "vl_ratio": heatmap_level[1]
                        }
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