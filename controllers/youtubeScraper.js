const configs = require('../configs');
const puppeteer = require('puppeteer');
const _ = require('underscore');

async function getListOfVideos(browser, keyword) {
    const page = await browser.newPage();
    page.setViewport({width: 1280, height: 800, deviceScaleFactor: 1});
    await page.goto(`https://www.youtube.com/results?sp=CAISBAgBEAFQFA%253D%253D&q=${keyword}`, {waitUntil: 'networkidle'});

    const container_selector = "ytd-video-renderer";
    const title_selector = "#video-title";
    const author_selector = '#byline';
    const duration_selector = "ytd-thumbnail-overlay-time-status-renderer span";

    function scrapeVideoMeta(selector) {
        const containers = [...document.querySelectorAll(selector)];
        if (!containers) {
            return [];
        }

        function parseSeconds(str){
            var p = str.split(':'),
                s = 0, m = 1;

            while (p.length > 0) {
                s += m * parseInt(p.pop(), 10);
                m *= 60;
            }

            return s;
        }

        function onlyVideo(video) {
            return video.querySelector(duration_selector);
        }

        function extractMeta(video) {
            const title =  video.querySelector(title_selector).getAttribute("title");
            const author = video.querySelector(author_selector).textContent;
            const duration =  parseSeconds(video.querySelector(duration_selector).textContent.replace(/\s/g, ''));
            const window = duration / (configs.SCREENSHOTS_PER_VIDEO+1);
            const video_id = video.querySelector(title_selector).getAttribute("href").replace(/\/watch\?v=/g, '');

            let times = [];
            for(let i = 1; i <= configs.SCREENSHOTS_PER_VIDEO; i++) {
                times[i] = i *  window;
            }

            return {
                content: {
                    title: title,
                    images: times,
                    text: "",
                },
                source: "youtube",
                media_type: "video",
                search_ref: [{
                    keyword: keyword,
                    type: "recent"
                }],
                local_id: video_id,
                author: author,
                
                timestamp: Math.round(new Date().getTime() / 1000)
            }
        }

        async function getVideoDescription(video) {
            const page = await browser.newPage();
            page.setViewport({width: 1280, height: 800, deviceScaleFactor: 1});
            const video_id = video.local_id
            await page.goto(`https://www.youtube.com/watch?v=${video_id}`, {waitUntil: 'networkidle'});

            const desc_selector = "#description";

            const desc = await page.evaluate(selector => {
                const element = document.querySelector(selector);
                return element.textContent;
            }, desc_selector);
            page.close();
            return desc;
        }

        let videos = containers
            .filter(onlyVideo)
            .map(extractMeta);
        
        let desc_promises = videos.map(async(video) => {
            const desc = await getVideoDescription(video);
            video.content.text = desc;
            return video;
        })

        videos = await Promise.all(desc_promises);
        
        return videos
    }

    const videos = await page.evaluate(scrapeVideoMeta, container_selector);

    return videos;
}

async function screenshot(browser, video_id, time) {
    
    // const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.setViewport({width: 1280, height: 800, deviceScaleFactor: 1});

    await page.goto(`https://www.youtube.com/embed/${video_id}?hd=1&autoplay=1&start=${time}`, {waitUntil: 'networkidle'});

    async function screenshotDOMElement(opts = {}) {
        const padding = 'padding' in opts ? opts.padding : 0;
        const selector = opts.selector;
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
            throw Error(`Could not find element that matches selector: ${selector}.`);

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
        selector: '.ytp-iv-video-content',
        padding: 0
    });

    return img_buffer;

}

async function scrapeKeyword(keyword) {
    const browser = await puppeteer.launch();
    const video_list = await getListOfVideos(browser, keyword);
    
    let video_promises = video_list.map(async (video) => {
        const video_id = video.local_id
        let shot_promises = video.content.images.map(async (time) => {
            buffer = await screenshot(browser, video_id, time)
            return buffer;
        })

        const images = await Promise.all(shot_promises);
        video.content.images = images;
        return video;
    })

    const videos = await Promise.all(video_promises);
    browser.close();
    return videos;
}

async function scrape() {
    const keywords = configs.YOUTUBE_SEARCH_KEYWORDS;
    try {
        logger.info('connecting to database...');
        const db = await MongoClient.connect(configs.DB_URL);
        let collection = db.collection(configs.DB_COLLECTION);
        let promises = keywords.map(async (keyword) => {
            return await scrapeKeyword(keyword)
        })
        let videos = await Promise.all(promises);

        function combineDuplicates(dict, video) {
            if (video.local_id in dict) {
                let old_search_ref = dict[video.local_id].search_ref;
                dict[video.local_id].search_ref = old_search_ref.concat(video.search_ref);
            } else {
                dict[video.local_id] = video;
            }
            return dict;
        }

        async function ignoreExistingVideos(id) {
            const post_exists = await collection.find({source:"youtube", local_id:id}).count() > 0;
            return post_exists;
        }

        // move all keyword results into one array
        videos = _.flatten(videos, true);
        // merge video with same id
        let video_dict = videos.reduce(combineDuplicates, {});
        let keys = Object.keys(video_dict);
        const unique_keys = keys.filter(removeExistingKeys);  //TODO cannot use async for filter
        // remove video that are already in database
        
        // push video to vision api
        // add into databse


    } catch (err) {
        logger.error(err);
        return error;
    }
}


module.exports = {
    scrape: async (req, res) => {
        const ret = await scrape();
        res.send(ret);
    }
}