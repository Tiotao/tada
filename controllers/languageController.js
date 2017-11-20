const config = require('config');
const Language = require('@google-cloud/language');
const language = Language.v1beta2({
    projectId: config.get("Credentials.google_cloud.project_id"),
    keyFilename: config.get("Credentials.google_cloud.keyfile_name"),
});
const logger  = require('logger').createLogger();
logger.setLevel(config.get("Logger.level"));

async function labelPosts(posts, sentiment=true) {

    async function label(post) {
        const document = {
            content: post.content.title,
            type: "PLAIN_TEXT"
        }

        try {

            if (sentiment) {
                return await language.analyzeEntitySentiment({
                    document: document
                })
            } else {
                return await language.analyzeEntities({
                    document: document
                })
            }

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
            delete e.sentiment;
            return e
        })
        posts[i].content.entities = entities;
        // posts[i].content.language = r[0].language;
    }

    const promises = posts.map(label)

    let response = await Promise.all(promises);

    response.map(updateEntryWithResponse);

    return posts.filter((p) => {return p && p.content.entities.length > 0});

}

module.exports = {
    label: labelPosts,
}