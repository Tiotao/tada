const c = require('./constants');
const _ = require('underscore');
const express = require('express');
const request = require('request-promise-native');
const cheerio = require('cheerio');
const logger  = require('logger').createLogger();
const Vision = require('@google-cloud/vision');
const vision = Vision({
    projectId: 'tada-vision',
    keyFilename: 'Tada-vision-a064f29f06e1.json'
});
const MongoClient = require('mongodb').MongoClient;
const schedule = require('node-schedule');

const app = express();

app.set('view engine', 'pug');
logger.setLevel('debug');

async function labelImagePosts(posts) {
    // create requests
    let requests = [];
    
    for (let i = 0; i < posts.length; i++) {
        const images = posts[i].content.images;
        for (let j = 0; j < images.length; j++) {
            requests.push({
                location: [i, j],
                request: {
                    source: {
                        imageUri: images[j]["high_res"]
                    }
                }  
            })
        }
    }
    logger.debug("total request:", requests.length);
    // run all requests together
    let promises = requests.map((r) => vision.labelDetection(r.request));
    logger.debug("total promises:", promises.length);
    let results = await Promise.all(promises);
    logger.debug("total results:", results.length);
    logger.info("all image posts are labelled.");
    // add label into post data

    for (let k = 0; k < results.length; k++) {
        const i = requests[k].location[0];
        const j = requests[k].location[1];
        const labels = results[k][0].labelAnnotations;
        let label_des = [];
        labels.forEach((label) => label_des.push({description: label.description, score: label.score}));
        posts[i].content.images[j].labels = label_des;
    }

    return posts;
}

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

async function updateDB(collection, db_entry) {
    if(db_entry.length === 0) {
        logger.info('no change to database.'); 
        return;
    }
    await collection.insert(db_entry);
}

function formTumblrSearchURL(keyword, type) {
    if (type === 'recent') {
        return c.TUMBLR_SEARCH_URL + keyword + '/recent';
    } else {
        return c.TUMBLR_SEARCH_URL + keyword;
    }
}


async function scrapeRecentImagesFromTumblr() {
    logger.info('start scarpping tumblr recent posts...');
    keywords = c.TUMBLR_SEARCH_KEYWORDS;
    try {
        logger.info('connecting to database...');
        const db = await MongoClient.connect(c.DB_URL);
        let collection = db.collection('image_posts');
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
            let db_entry = await labelImagePosts(posts);
            return db_entry;
        });


        let db_entries = await Promise.all(promises);
        //TODO needs combine keywords
        // flatten results and update database once
        db_entries = [].concat.apply([], db_entries);
        let merged_entries = [];
        // merge same post from different keywords
       
        for (let i = 0; i < db_entries.length; i++) {
            const entry = db_entries[i]
            const exist_index = merged_entries.findIndex((e)=>{
                return entry.local_id.toString() == e.local_id.toString();
            });
            logger.debug(exist_index);
            if (exist_index >= 0){
                merged_entries[exist_index].search_ref.push(entry.search_ref[0]);
            } else {
                merged_entries.push(entry);
            }
        }

        logger.debug(merged_entries);

        logger.info("collapse db with same local_id:", db_entries.length, '->', merged_entries.length);
        await updateDB(collection, merged_entries);
        logger.info('database updated with', merged_entries.length, 'posts.');
        return merged_entries;

    } catch (err) {
        logger.error(err);
        return error;
    }
}

app.get('/scrape_tumblr', async (req, res) => {
    let ret = await scrapeRecentImagesFromTumblr();
    res.send(ret);
})

app.get('/label/:start-:end', async (req, res) => {
    logger.info('connecting to database...');
    const db = await MongoClient.connect(c.DB_URL);
    let collection = db.collection('image_posts');
    const start_time = parseInt(req.params.start);
    const end_time = parseInt(req.params.end);
    let posts = await collection.find({timestamp: {$gt: start_time, $lt: end_time}}).toArray();

    let result_score;

    try {
        const posts_label_scores = posts.map(post => {
            const num_images = post.content.images.length;
            let labels = _.flatten(post.content.images.map(img=>{return img.labels}))
            labels = labels.reduce((memo, obj) => {
                    if (!memo[obj.description]) { memo[obj.description] = 0; }
                    memo[obj.description] += obj.score;
                    return memo; 
                }, {});
                return _.mapObject(labels, (val, key) => {
                    return val / num_images;
                })
            })
        
        console.log(posts_label_scores);

        result_score = posts_label_scores.reduce((memo, obj) => {
            _.mapObject(obj, (val, key) => {
                if (!memo[key]) { memo[key] = 0; }
                memo[key] += val;
            })
            return memo;
        })
    } catch (error) {
        logger.error(error);
        result_score = {}
    }

    // get label score for each post
    
    res.send(result_score);
})

app.listen('8081');

// run schedule job
if (c.SCHEDULE_SCRAPE) {
    schedule.scheduleJob(c.SCRAPE_TIME, scrapeRecentImagesFromTumblr);
}


console.log('Magic happens on 8081');

exports = module.exports = app;