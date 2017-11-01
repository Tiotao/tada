const MongoClient = require('mongodb').MongoClient;
const configs = require('../configs');
const puppeteer = require('puppeteer');
const _ = require('underscore');
const color = require('img-color');
const visionCtrl = require('./visionController');
const languageCtrl = require('./languageController');
const logger  = require('logger').createLogger();
const utils = require('../utils/scrape-utils');
const natural = require('natural');
const parallel = require('async-await-parallel');
logger.setLevel(configs.LOGGER_LEVEL);

async function getVideoStats(browser, video_id) {
    logger.info('getting stats for video: ' + video_id)
    try {
        const page = await browser.newPage();
        await page.goto(`https://www.youtube.com/watch?v=${video_id}`, {waitUntil: 'networkidle'});
    
        const view_count_selector = "span.view-count";
        const view_count = await page.evaluate(selector => {
            const element = document.querySelector(selector);
            let d = ""
            if (element) {
                d = element.textContent;
            }
            return d;
        }, view_count_selector);
        await page.close();
        return {
            id: video_id,
            view_count: parseInt(view_count.replace(/views/g,'')) || -1
        }
    } catch (err) {
        logger.error(err);
        await page.close();
        return {
            id: video_id,
            view_count: -1
        }
    }
    
}

async function getListOfVideos(browser, keyword, options) {
    logger.info('labelling', 'recent', 'posts from:', keyword);
    const page = await browser.newPage();
    page.setViewport({width: 1280, height: 800, deviceScaleFactor: 1});
    page.on('console', console.log);
    let url;
    if (options.is_recent) {
        url = `https://www.youtube.com/results?sp=CAISBAgBEAFQFA%253D%253D&q=${keyword}`
    } else {
        url = `https://www.youtube.com/results?q=${keyword}`
    }

    await page.goto(url, {waitUntil: 'networkidle'});
    
    function scrapeVideoMeta(options) {

        const container_selector = "ytd-video-renderer";
        const title_selector = "#video-title";
        const author_selector = '#byline';
        const duration_selector = "ytd-thumbnail ytd-thumbnail-overlay-time-status-renderer span";

        const containers = [...document.querySelectorAll(container_selector)];
        
        if (!containers) {
            return [];
        }

        
        function onlyVideo(video, index) {
            const duration_label = video.querySelector(duration_selector);
            let reached_max;
            if (options.max) {
                reached_max = index > options.max;
            } else {
                reached_max = false;
            }
            return duration_label && duration_label.getAttribute("aria-label") != 'LIVE' && !reached_max;
        }

        function extractMeta(video) {

            function parseSeconds(str){
                var p = str.split(':'),
                    s = 0, m = 1;

                while (p.length > 0) {
                    s += m * parseInt(p.pop(), 10);
                    m *= 60;
                }
                return s;
            }
                        
            const title =  video.querySelector(title_selector).getAttribute("title");
            const author = video.querySelector(author_selector).textContent;
            const duration =  parseSeconds(video.querySelector(duration_selector).textContent.replace(/\s/g, ''));
            const window = duration / (options.num_shots+1);
            const video_id = video.querySelector(title_selector).getAttribute("href").replace(/\/watch\?v=/g, '');

            const v = {
                content: {
                    title: title,
                    // images: times,
                    text: "",
                },
                source: "youtube",
                media_type: "video",
                search_ref: [{
                    keyword: options.keyword,
                    type: options.search_type
                }],
                local_id: video_id,
                author: author,
                
                timestamp: Math.round(new Date().getTime() / 1000)
            }
            return v;
        }

        

        let videos = containers
            .filter(onlyVideo, this)
            .map(extractMeta);
        
        
        

        return videos
    }

    async function getVideoDescription(video) {
        const page = await browser.newPage();
        page.on('console', console.log);
        page.setViewport({width: 1280, height: 800, deviceScaleFactor: 1});
        const video_id = video.local_id
        logger.debug(video_id);
        await page.goto(`https://www.youtube.com/watch?v=${video_id}`, {waitUntil: 'networkidle'});

        const desc_selector = "#description";

        const desc = await page.evaluate(selector => {
            const element = document.querySelector(selector);
            let d = ""
            if (element) {
                d = element.textContent;
            }
            return d;
        }, desc_selector);
        await page.close();
        return desc;
    }

    const scrape_options = { 
        num_shots: configs.SCREENSHOTS_PER_VIDEO, 
        keyword: keyword,
        search_type: "recent",
        max: options.max
    }

    try {
        let videos = await page.evaluate(scrapeVideoMeta, scrape_options);
        if (!options.meta_only) {
            logger.debug(videos)
            let desc_promises = videos.map(async(video) => {
                const desc = await getVideoDescription(video);
                video.content.text = desc;
                return video;
            })
            videos = await Promise.all(desc_promises);
        }
        return videos;

    } catch (err) {
        logger.error(err);
        
        return []
    }
}

async function screenshot(browser, video_id, time) {
    
    // const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.setViewport({width: 1280, height: 800, deviceScaleFactor: 1});
    page.on('console', console.log);

    logger.debug(`Taking screenshot of ${video_id} at ${time}`);

    await page.goto(`https://www.youtube.com/embed/${video_id}?hd=1&autoplay=1&start=${time}`, {waitUntil: 'networkidle'});

    async function screenshotDOMElement(opts = {}) {
        const padding = 'padding' in opts ? opts.padding : 0;
        const selector = opts.selector;
        const video_id = opts.video_id;
        const time = opts.time;
        if (!selector) 
            throw Error('Please provide a selector.');

        const rect = await page.evaluate(selector => {
            const element = document.querySelector(selector);
            if (!element)
                return null;
            const {x, y, width, height} = element.getBoundingClientRect();
            
            return {left: x, top: y, width, height, id: element.id};
        }, selector);

        if (!rect)
            throw Error(`Could not find element that matches selector: ${selector} for ${video_id} at ${time}.`);

        const shot = await page.screenshot({
            clip: {
                x: rect.left - padding,
                y: rect.top - padding,
                width: rect.width + padding * 2,
                height: rect.height + padding * 2
            }
        });
        return shot;
    }

    const img_buffer = await screenshotDOMElement({
        selector: '.ytp-iv-video-content, video',
        video_id: video_id,
        time: time,
        padding: 0
    });

    logger.debug(`Took screenshot of ${video_id} at ${time}`);
    await page.close();
    return img_buffer;

}

async function scrapeKeyword(video_collection, keyword, options) {
    
    const browser = await puppeteer.launch();
    
    let raw_video_list = await getListOfVideos(browser, keyword, options);
    let video_list = []

    try {
        await browser.close();
    } catch (err) {
        console.log("browser close failed")
    }

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

async function scrape() {
    logger.info('start scarpping youtube recent posts...');
    const keywords = configs.YOUTUBE_SEARCH_KEYWORDS;
    try {
        logger.info('connecting to database...');
        const db = await MongoClient.connect(configs.DB_URL);
        let video_collection = db.collection(configs.VIDEO_COLLECTION);
        let label_collection = db.collection(configs.LABEL_COLLECTION);
        
        let promises = keywords.map(async (keyword) => {
            return await scrapeKeyword(video_collection, keyword, {
                is_recent: true,
                meta_only: false
            })
        })

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

async function scrapeStats() {
    try {

        console.time("SCRAPE_STATS");

        logger.info('scrapping stats of youtube video...')
        logger.info('connecting to database...');
        const db = await MongoClient.connect(configs.DB_URL);
        let video_collection = db.collection(configs.VIDEO_COLLECTION);

        let videos = await video_collection.aggregate(
            [
                {
                    $project: {
                        _id: 0,
                        local_id: 1
                    }
                }
            ]
        ).toArray();

        // videos = videos.slice(0, 10);

        const browser = await puppeteer.launch();

        let promises = videos.map((v) => {
            return async ()=>{
                const data = await getVideoStats(browser, v.local_id);
                logger.debug(v.local_id + " finished!")
                return data;
            }
        });

        const view_counts = await parallel(promises, 20);

        let update_promises = view_counts.map((vc) => {
            return async() => {
                await video_collection.findOneAndUpdate({
                    "local_id": vc.id
                }, {
                    $set: {
                        "stats": {
                            "view_count": vc.view_count
                        }
                    }
                })
            }
        })

        await parallel(update_promises, 100);

        logger.log(`${update_promises.length} videos' stats updated.`)
        console.timeEnd("SCRAPE_STATS");
        await browser.close();
    } catch (err) {
        logger.error(err);
        await browser.close();
    }

}

async function scrapePopular() {
    logger.info('start scarpping youtube popular posts...');
    const keywords = configs.YOUTUBE_POPULAR_SEARCH_KEYWORDS;
    try {
        const browser = await puppeteer.launch();
        const promises = keywords.map(async (keyword) => {
            return {
                value: await getListOfVideos(browser, keyword, {
                    is_recent: false,
                    meta_only: true,
                    max: 5
                }), 
                key: keyword
            }

        })

        let videos = await Promise.all(promises);
        await browser.close();
        return videos;

    } catch (err) {
        logger.error(err);
        await browser.close();
        return [];
    }
}

module.exports = {
    scrape: async (req, res) => {
        const ret = await scrape();
        res.send(ret);
    },

    scrapePopular: async(req, res) => {
        const ret = await scrapePopular();
        res.render('index', {video_lists: ret});
    },

    scrapeStats: scrapeStats,
    
    scheduleScraping: scrape,

}