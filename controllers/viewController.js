
const request = require('request-promise-native');
const logger  = require('logger').createLogger();
const config = require('config');
logger.setLevel(config.get("Logger.level"));

/**
 * Render Front end interface
 * @param {Object} req - standard express request object
 * @param {Object} res - standard express response object
 */
async function renderInterface(req, res) {
    res.render('../react/src/index', {
        title: "Tada interface prototype"
    })
}

module.exports = {
    renderInterface: renderInterface
}