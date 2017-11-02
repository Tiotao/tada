
const request = require('request-promise-native');
const logger  = require('logger').createLogger();
const configs = require('../configs');

logger.setLevel(configs.LOGGER_LEVEL);

async function renderInterface(req, res) {
    // let json;
    // try {
    //     const options = {
    //         method: 'GET',
    //         url: `http://localhost:${configs.PORT}/api/labels`,
    //         json: true
    //     }
        
    //     json = await request(options)
    // } catch (err) {
    //     logger.log(err);
    //     json = {}
    // }
     
    

    res.render('../react/src/index', {
        title: "Tada interface prototype"
        // data: json.data
    })
    
}

module.exports = {
    renderInterface: renderInterface
}