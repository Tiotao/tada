const MongoClient = require('mongodb').MongoClient;
const configs = require('../configs');
const puppeteer = require('puppeteer');
const _ = require('underscore');
const visionCtrl = require('./visionController');
const logger  = require('logger').createLogger();
const utils = require('../utils/scrape-utils');
logger.setLevel(configs.LOGGER_LEVEL);

async function getListOfVideos(browser, keyword) {
    logger.info('labelling', 'recent', 'posts from:', keyword);
    const page = await browser.newPage();
    page.setViewport({width: 1280, height: 800, deviceScaleFactor: 1});
    page.on('console', console.log);
    await page.goto(`https://www.youtube.com/results?sp=CAISBAgBEAFQFA%253D%253D&q=${keyword}`, {waitUntil: 'networkidle'});

    function scrapeVideoMeta(options) {

        const container_selector = "ytd-video-renderer";
        const title_selector = "#video-title";
        const author_selector = '#byline';
        const duration_selector = "ytd-thumbnail ytd-thumbnail-overlay-time-status-renderer span";

        const containers = [...document.querySelectorAll(container_selector)];
        
        if (!containers) {
            return [];
        }

        
        function onlyVideo(video) {
            const duration_label = video.querySelector(duration_selector);
            return duration_label && duration_label.getAttribute("aria-label") != 'LIVE';
        }

        function extractMeta(video) {
            const title =  video.querySelector(title_selector).getAttribute("title");
            const author = video.querySelector(author_selector).textContent;
            const duration =  utils.parseSeconds(video.querySelector(duration_selector).textContent.replace(/\s/g, ''));
            const window = duration / (options.num_shots+1);
            const video_id = video.querySelector(title_selector).getAttribute("href").replace(/\/watch\?v=/g, '');

            let times = [];
            for(let i = 1; i <= options.num_shots; i++) {
                times[i-1] = Math.floor(i *  window);
            }

            const v = {
                content: {
                    title: title,
                    images: times,
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
            .filter(onlyVideo)
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
        page.close();
        return desc;
    }

    const scrape_options = { 
        num_shots: configs.SCREENSHOTS_PER_VIDEO, 
        keyword: keyword,
        search_type: "recent"
    }

    try {
        let videos = await page.evaluate(scrapeVideoMeta, scrape_options);
        logger.debug(videos)
        let desc_promises = videos.map(async(video) => {
            const desc = await getVideoDescription(video);
            video.content.text = desc;
            return video;
        })
        videos = await Promise.all(desc_promises);
        return videos;

    } catch (err) {
        logger.error(err);
        browser.close();
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
    page.close();
    return img_buffer;

}

async function scrapeKeyword(collection, keyword) {
    const browser = await puppeteer.launch();
    let raw_video_list = await getListOfVideos(browser, keyword);
    let video_list = []

    async function ignoreExistingVideos(video) {
        const post_exists = await collection.find({source:"youtube", local_id: video.local_id}).count() > 0;
        if (!post_exists) {
            video_list.push(video);
        }
        return;
    }

    try {
        let unique_promises = raw_video_list.map(ignoreExistingVideos)
        await Promise.all(unique_promises); 

        let videos = [];

        // take screenshot for every video
        for (var i = 0; i < video_list.length; i++) {
            let video = video_list[i];
            const video_id = video.local_id;
            let shot_promises = video.content.images.map(async (time) => {
                try {
                    buffer = await screenshot(browser, video_id, time)
                    return {
                        data: buffer,
                        sec: time
                    };
                } catch (err) {
                    logger.error(err);
                    return null;
                }
            })
            
            const images = await Promise.all(shot_promises);
            // filter away vidoes with incomplete screenshots
            const has_null = images.some((e)=>{ return !e; })
            if (has_null) {
                video.content.image = null;
            } else {
                video.content.images = images;
            }
            
            videos.push(video);
        }
        
        
        videos = videos.filter((v) => {
            return v.content.images;
        })

        browser.close();
        return videos;
    } catch (err) {
        logger.error(err);
        browser.close();
        return [];
    }
}

async function scrape() {
    logger.info('start scarpping youtube recent posts...');
    const keywords = configs.YOUTUBE_SEARCH_KEYWORDS;
    try {
        logger.info('connecting to database...');
        const db = await MongoClient.connect(configs.DB_URL);
        let collection = db.collection(configs.TEST_DB_COLLECTION);
        
        const promises = keywords.map(async (keyword) => {
            return await scrapeKeyword(collection, keyword)
        })

        let videos = await Promise.all(promises);

        videos = utils.combineDuplicates(videos);

        // push video to vision api
        const vision_options = {
            api_type: "webDetection", 
            data_type: "buffer",
        }
        
        const db_entry = await visionCtrl.label(videos, vision_options)
        
        // add into databse
        if(db_entry.length === 0) {
            logger.info('no change to database.'); 
            return;
        }
        await collection.insert(db_entry);
        db.close();
        logger.info('database updated with', db_entry.length, 'posts.');
        
        return db_entry;

    } catch (err) {
        logger.error(err);
        return err;
    }
}


module.exports = {
    scrape: async (req, res) => {
        const ret = await scrape();
        res.send(ret);
    },
    
    scheduleScraping: scrape,
}