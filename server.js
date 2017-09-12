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

app.set('view engine', 'pug')

async function labelImages(photoset, meta) {
    let posts = []
    for (var j = 0; j < photoset.length; j++) {
        let image = photoset[j];
        
        let r = {
            source: {
                imageUri: image["low_res"],
            }
        };
        let results = await vision.labelDetection(r);
        let labels = results[0].labelAnnotations;
        let label_des = [];
        labels.forEach((label) => label_des.push(label.description));
        posts.push({
            author: meta.author,
            caption: meta.caption,
            labels: labels,
            label_des: label_des,
            image_url: {
                low_res: image["low_res"],
                high_res: image["high_res"]
            }
        });

    }


    return posts;
}

async function processPosts($) {
    let results = [];
    let posts = $('.posts')[0].children;
    for (var i = 0; i < 5; i++) {
        let post = posts[i];
        let caption = $(post).find(".post_body p").text();
        let data = JSON.parse(post.attribs["data-json"]);
        let author = data["tumblelog"];
        if (data.type === "photoset") {
            let photoset = data["photoset_photos"];
            
            var meta = {
                author: author,
                caption: caption,
            }
            let posts = await labelImages(photoset, meta);
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

        res.render('index', json)
    });
})

app.listen('8081');

console.log('Magic happens on 8081');

exports = module.exports = app;