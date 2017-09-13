const c = require('./constants');

const express = require('express');
const fs = require('fs');
const request = require('request-promise-native');
const cheerio = require('cheerio');
const app = express();
const Vision = require('@google-cloud/vision');
const vision = Vision({
    projectId: 'tada-vision',
    keyFilename: 'Tada-vision-a064f29f06e1.json'
});
const MongoClient = require('mongodb').MongoClient;


app.set('view engine', 'pug')

async function labelImagePosts(posts) {
    for (let i = 0; i < posts.length; i++) {
        const images = posts[i].content.images;
        
        for (let j = 0; j < images.length; j++) {
            const image_url = images[j]["low_res"];
            const request = {
                source: {
                    imageUri: image_url
                }
            }
            const results = await vision.labelDetection(request);
            const labels = results[0].labelAnnotations;
            let label_des = [];
            labels.forEach((label) => label_des.push({description: label.description, score: label.score}));
            posts[i].content.images[j].labels = label_des;
        }
    }
    return posts;
}

async function processImagePostsFromTumblr(html, collection) {
    const $ = cheerio.load(html);
    const posts = $('.posts')[0].children;
    let posts_data = [];
    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const caption = $(post).find('.post_body p').text();
        const meta_data = JSON.parse(post.attribs["data-json"]);

        // examine if post has been analyzed
        
        const post_exists = await collection.find({source:"tumblr", local_id:meta_data["root_id"]}).count() > 0;

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
            local_id: meta_data["root_id"].toString(),
            source: "tumblr",
            media_type: "image",
            author: meta_data["tumblelog"],
            content: {
                images: images,
                text: caption
            }
        }

        posts_data.push(p);
    }
    return posts_data;
}

async function updateDB(collection, db_entry) {
    await collection.insert(db_entry);
}

async function scrapeRecentImagesFromTumblr() {
    const url = c.TUMBLR_SEARCH_URL;
    try {
        const html = await request(url);
        const db = await MongoClient.connect(c.DB_URL);
        let collection = db.collection('image_posts');
        let posts = await processImagePostsFromTumblr(html, collection);
        let db_entry = await labelImagePosts(posts);
        await updateDB(collection, db_entry);
        console.log(db_entry);
        return db_entry
    } catch (err) {
        console.error(err);
        return error;
    }
}


app.get('/scrape_tumblr', async (req, res) => {
    let ret = await scrapeRecentImagesFromTumblr();
    res.send(ret);
})

// app.get('/scrape', (req, res) => {
//     url = c.TUMBLR_SEARCH_URL;
//     request(url, async (error, response, html) => {
//         var json = {
//             posts: [],
//             users: []
//         }
//         if (!error) {
//             let $ = cheerio.load(html);
//             posts = await processPosts($);
//             json.posts = posts;
            
//             const db = await MongoClient.connect('mongodb://localhost:27017/tada-test');
//             const cursor =  db.collection('usercollection').find();
//             for (let user = await cursor.next(); user != null; user = await cursor.next()) {
//                 json.users.push(user.username);
//             }
//         } else {
//             json = error
//         }

//         res.render('index', json)
//     });
// })

app.listen('8081');

console.log('Magic happens on 8081');

exports = module.exports = app;