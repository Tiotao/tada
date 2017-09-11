const express = require('express');
const fs = require('fs');
const request = require('request');
const cheerio = require('cheerio');
const app = express();
const Vision = require('@google-cloud/vision');
const vision = Vision({
    projectId: 'tada-vision',
    keyFilename: 'Tada-vision-a064f29f06e1.json'
});

async function labelImages(photoset, meta) {
    let posts = []
    for (var j = 0; j < photoset.length; j++) {
        const image = photoset[j];
        const r = {
            source: {
                imageUri: image["low_res"],
            }
        };
        const results = await vision.labelDetection(r);
        const labels = results[0].labelAnnotations;
        let label_des = [];
        labels.forEach((label) => label_des.push(label.description));
        meta.labels = labels;
        meta.label_des = label_des;
        meta.image_url = {
            low_res: image["low_res"],
            high_res: image["high_res"]
        }
        posts.push(meta);
    }
    return posts;
}

async function processPosts($) {
    let results = [];
    let posts = $('.posts')[0].children;
    for (var i = 0; i < posts.length; i++) {
        const post = posts[i];
        const caption = $(post).find(".post_body p").text();
        const data = JSON.parse(post.attribs["data-json"]);
        const author = data["tumblelog"];
        if (data.type === "photoset") {
            const photoset = data["photoset_photos"];
            var meta = {
                author: author,
                caption: caption,
            }
            const posts = await labelImages(photoset, meta);
            results = results.concat(posts);
        }
    }
    
    return results;
    
}


app.get('/scrape', (req, res) => {
    url = 'https://www.tumblr.com/search/sims4/recent'
    request(url, async (error, response, html) => {
        var json = {
            posts: []
        }
        if (!error) {
            let $ = cheerio.load(html);
            posts = await processPosts($);
            json.posts = posts;
        } else {
            json = error
        }
        res.send(json)
    });
})

app.listen('8081');

console.log('Magic happens on 8081');

exports = module.exports = app;