const MongoClient = require('mongodb').MongoClient;
const configs = require('../configs');
const puppeteer = require('puppeteer');
const _ = require('underscore');
const languageCtrl = require('./languageController');
const logger  = require('logger').createLogger();
const utils = require('../utils/scrape-utils');
logger.setLevel(configs.LOGGER_LEVEL);


async function getTweets(browser, keyword) {
    logger.info('labelling', 'recent', 'posts from:', keyword);
    const page = await browser.newPage();
    page.on('console', console.log);
    await page.goto(`https://twitter.com/search?f=tweets&vertical=default&q=${keyword}&src=typd`, {waitUntil: 'networkidle'});


    function scrapeTweet(options) {
        const container_selector = ".tweet";
        const text_selector = ".tweet-text";
        const time_selector = "span._timestamp";
        
        const containers = [...document.querySelectorAll(container_selector)];

        if (!containers) {
            return [];
        }

        function extractData(tweet) {
            const text = tweet.querySelector(text_selector).textContent.replace(/\n/g, " ");
            const tweet_id = tweet.getAttribute("data-tweet-id").toString();
            const author = tweet.getAttribute("data-screen-name").toString();
            const timestamp = parseInt(tweet.querySelector(time_selector).getAttribute("data-time"));

            const t = {
                content: {
                    text: text,
                },
                source: "twitter",
                media_type: "text",
                search_ref: [{
                    keyword: options.keyword,
                    type: options.search_type
                }],
                local_id: tweet_id,
                author: author,
                
                timestamp: timestamp || Math.round(new Date().getTime() / 1000)
            }

            return t;
        }

        let tweets = containers
            .map(extractData);
        
        return tweets;

    }

    const scrape_options = { 
        keyword: keyword,
        search_type: "recent"
    }

    try {
        let tweets = await page.evaluate(scrapeTweet, scrape_options);
        logger.debug(tweets);
        return tweets;
    } catch (err) {
        logger.error(err);
        browser.close();
        return[];
    }
    
}

async function scrapeKeyword(collection, keyword) {
    const browser = await puppeteer.launch();
    let raw_tweets = await getTweets(browser, keyword);
    let tweets = []

    async function ignoreExistingTweets(tweet) {
        const tweet_exists = await collection.find({source: "twitter", local_id: tweet.local_id}).count() > 0;
        if (!tweet_exists) {
            tweets.push(tweet);
        }
        return;
    }

    try {
        await Promise.all(raw_tweets.map(ignoreExistingTweets));
        browser.close();
        return tweets;
    } catch (err) {
        logger.error(err);
        browser.close();
        return [];
    }
    
}


async function scrape() {
    logger.info('start scarpping twitter recent posts...');
    const keywords = configs.TWITTER_SEARCH_KEYWORDS;
    try {
        const db = await MongoClient.connect(configs.DB_URL);
        let collection = db.collection(configs.TEST_DB_COLLECTION);

        const promises = keywords.map(async (keyword) => {
            return await scrapeKeyword(collection, keyword);
        })

        let tweets = await Promise.all(promises);

        tweets = utils.combineDuplicates(tweets);

        db_entry = await languageCtrl.label(tweets);

        logger.info(db_entry);

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