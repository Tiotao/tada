
const request = require('request-promise-native');
const logger  = require('logger').createLogger();
const config = require('config');
logger.setLevel(config.get("Logger.level"));

async function renderInterface(req, res) {
    res.render('../react/src/index', {
        title: "Tada interface prototype"
    })
}

module.exports = {
    renderInterface: renderInterface
}