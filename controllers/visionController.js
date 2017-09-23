const Vision = require('@google-cloud/vision');
const vision = Vision({
    projectId: 'tada-vision',
    keyFilename: 'Tada-vision-a064f29f06e1.json'
});
const configs = require('../configs');
const request = require('request-promise-native');
const logger  = require('logger').createLogger();
logger.setLevel(configs.LOGGER_LEVEL);

async function labelPosts(posts, options) {
    const data_type = "data_type" in options ? options.data_type : "url";
    const api_type = "api_type" in options ? options.data_type : "labelDetection";
    
    let requests = [];
    
    for (let i = 0; i < posts.length; i++) {
        const images = posts[i].content.images;
        for (let j = 0; j < images.length; j++) {
            
            let request_content;

            if (data_type == "url") {
                request_content = {
                    source: {
                        imageUri: images[j]["high_res"]
                    }
                }
            } else {
                request_content = {
                    content: images[j]["data"]
                }
            }

            requests.push({
                location: [i, j],
                request: request_content
            })
        }
    }

    logger.debug(requests);
    
    let promises;
    // run all requests together
    if (api_type == "webDetection") {
        promises = requests.map((r) => vision.webDetection(r.request));
    } else {
        promises = requests.map((r) => vision.labelDetection(r.request));
    }
    
    let results = await Promise.all(promises);
    logger.info("all image posts are labelled.");
    // add label into post data

    logger.debug(results);

    for (let k = 0; k < results.length; k++) {
        const i = requests[k].location[0];
        const j = requests[k].location[1];
        let labels;
        if (api_type == "webDetection") {
            labels = results[k][0].webDetection.webEntities;
        } else {
            labels = results[k][0].labelAnnotations;
        }
        let label_des = [];

        if (configs.STANDARD_SCORE && api_type == "webDetection") {
            labels.forEach((label) => label_des.push({description: label.description, score: 1}));
        } else {
            labels.forEach((label) => label_des.push({description: label.description, score: label.score}));
        }
        
        posts[i].content.images[j].labels = label_des;
        delete posts[i].content.images[j]["data"];
    }
    return posts;
}

module.exports = {
    label: labelPosts,
}