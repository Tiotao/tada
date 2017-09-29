const Language = require('@google-cloud/language');
const language = Language.v1beta2({
    projectId: 'tada-vision',
    keyFilename: 'Tada-vision-a064f29f06e1.json'
});
const logger  = require('logger').createLogger();
logger.setLevel(configs.LOGGER_LEVEL);

async function labelPosts(posts) {

    async function label(post) {
        const document = {
            content: post.content.text,
            type: "PLAIN_TEXT"
        }

        try {
            return await language.analyzeEntitySentiment({
                document: document
            })
        } catch (err) {
            logger.error(err);
            return null;
        }
    }

    function updateEntryWithResponse(r, i) {

        if (!r) {
            posts[i] = null;
            return;
        }
        let entities = r[0].entities;
        entities = entities.map(function(e){
            delete e.mentions;
            delete e.metadata;
            return e
        })
        posts[i].content.entities = entities;
        posts[i].content.language = r[0].language;
    }

    const promises = posts.map(label)


    let response = await Promise.all(promises);

    response.map(updateEntryWithResponse);

    return posts.filter((p) => {return p && p.content.entities.length > 0});

}

module.exports = {
    label: labelPosts,
}