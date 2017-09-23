const MongoClient = require('mongodb').MongoClient;
const cheerio = require('cheerio');
const request = require('request-promise-native');
const configs = require('../configs');
const _ = require('underscore');
const visionCtrl = require('./visionController');
const logger  = require('logger').createLogger();
logger.setLevel(configs.LOGGER_LEVEL);

async function processImagePostsFromTumblr(html, collection, search_ref) {
    const $ = cheerio.load(html);
    const posts = $('.posts')[0].children;
    let posts_data = [];
    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const caption = $(post).find('.post_body p').text();
        const meta_data = JSON.parse(post.attribs["data-json"]);
        const local_id = meta_data["root_id"].toString();

        // examine if post has been analyzed
        
        const post_exists = await collection.find({source:"tumblr", local_id:local_id}).count() > 0;

        if (post_exists) {
            continue;
        }
        
        // analyze
        const post_media = $(post).find('.post_media');
        let images;
        if (meta_data.type === "photoset") {
            images = meta_data["photoset_photos"];
        } else if (meta_data.type === "photo") {
            images = [post_media.data("lightbox")];
        } else {
            continue;
        }

        let p = {
            local_id: local_id,
            source: "tumblr",
            media_type: "image",
            search_ref: search_ref,
            author: meta_data["tumblelog"],
            timestamp: Math.round(new Date().getTime() / 1000),
            content: {
                images: images,
                text: caption
            }
        }

        posts_data.push(p);
    }
    logger.info(posts.length, 'recent posts found, ', posts_data.length, 'posts new.')
    return posts_data;
}

function formTumblrSearchURL(keyword, type) {
    if (type === 'recent') {
        return configs.TUMBLR_SEARCH_URL + keyword + '/recent';
    } else {
        return configs.TUMBLR_SEARCH_URL + keyword;
    }
}

async function updateDB(collection, db_entry) {
    if(db_entry.length === 0) {
        logger.info('no change to database.'); 
        return;
    }
    await collection.insert(db_entry);
}


async function scrapeRecentImagesFromTumblr() {
    logger.info('start scarpping tumblr recent posts...');
    const keywords = configs.TUMBLR_SEARCH_KEYWORDS;
    try {
        logger.info('connecting to database...');
        const db = await MongoClient.connect(configs.DB_URL);
        let collection = db.collection(configs.DB_COLLECTION);
        let search_request = keywords.map((k)=>{
            const url = formTumblrSearchURL(k, 'recent');
            let search_ref = [{
                keyword: k,
                type: 'recent'
            }]
            const req = { url: url, search_ref: search_ref};
            return req;
        })
        // label posts from each keyword
        let promises = search_request.map(async (r) =>{
            const html = await request(r.url);
            let posts = await processImagePostsFromTumblr(html, collection, r.search_ref);
            logger.info('labelling', r.search_ref[0].type, 'posts from:', r.search_ref[0].keyword);

            const vision_options = {
                api_type: "labelDetection", 
                data_type: "url",
            }

            const db_entry = await visionCtrl.label(posts, vision_options);
            return db_entry;
        });

        function combineDuplicates(dict, entry) {
            if (entry.local_id in dict) {
                let old_search_ref = dict[entry.local_id].search_ref;
                dict[entry.local_id].search_ref = old_search_ref.concat(entry.search_ref);
            } else {
                dict[entry.local_id] = entry;
            }
            return dict;
        }


        let db_entries = await Promise.all(promises);
        // flatten results and update database once
        db_entries = _.flatten(db_entries, true);
        
        let db_entries_dict = db_entries.reduce(combineDuplicates, {});

        merged_entries = Object.values(db_entries_dict);

        logger.debug(merged_entries);

        logger.info("collapse db with same local_id:", db_entries.length, '->', merged_entries.length);
        await updateDB(collection, merged_entries);
        logger.info('database updated with', db_entries.length, 'posts.');
        db.close();
        return merged_entries;

    } catch (err) {
        logger.error(err);
        return error;
    }
}

module.exports = {
    scrape: async (req, res) => {
        const ret = await scrapeRecentImagesFromTumblr();
        res.send(ret);
    },

    scheduleScraping: scrapeRecentImagesFromTumblr
}