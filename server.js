const express = require('express');
const morgan  = require('morgan')
const logger  = require('logger').createLogger();
const cors = require('cors')
const schedule = require('node-schedule');
const app = express();
const routes = require('./routes');
const configs = require('./configs');
const bodyParser = require('body-parser')
const router = express.Router();
const tumblrScraper = require('./controllers/tumblrScraper');
const twitterScraper = require('./controllers/twitterScraper');
const youtubeScraper = require('./controllers/youtubeScraper');

logger.setLevel(configs.LOGGER_LEVEL);
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.set('view engine', 'pug');
app.use(morgan('tiny'));

// allow cros
app.use(cors());

app.use('/api', routes);
app.listen('8081');

logger.debug(JSON.stringify(configs, null, 2));


// run schedule job
if (configs.SCHEDULE_SCRAPE) {
    logger.debug("schedule jobs");
    // schedule.scheduleJob(configs.SCRAPE_TIME, tumblrScraper.scheduleScraping);
    schedule.scheduleJob(configs.SCRAPE_TIME, twitterScraper.scheduleScraping);
    // schedule.scheduleJob(configs.SCRAPE_TIME, youtubeScraper.scheduleScraping);
}

console.log('Magic happens on 8081');

exports = module.exports = app;