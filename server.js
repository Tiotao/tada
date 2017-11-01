const express = require('express');
const morgan  = require('morgan')
const logger  = require('logger').createLogger();
const cors = require('cors')
const schedule = require('node-schedule');
const app = express();
const routes = require('./routes/routes');
const configs = require('./configs');
const bodyParser = require('body-parser')
const router = express.Router();
const tumblrScraper = require('./controllers/tumblrScraper');
const twitterScraper = require('./controllers/twitterScraper');
const youtubeScraper = require('./controllers/youtubeScraper');
const dataController = require('./controllers/dataController');

logger.setLevel(configs.LOGGER_LEVEL);
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.set('view engine', 'pug');
app.use(morgan('tiny'));
app.use(express.static('public'));
console.log("serving public")

// allow cros
app.use(cors());

app.use('/api', routes.api);
app.use('/', routes.view);
app.use('/manage', routes.dashboard);
app.listen(configs.PORT);

logger.debug(JSON.stringify(configs, null, 2));


// run schedule job
if (configs.SCHEDULE_SCRAPE) {
    logger.debug("schedule jobs");
    schedule.scheduleJob(configs.SCRAPE_TIME, async () => {
        logger.log("Scrapping...");
        await youtubeScraper.scheduleScraping();
        logger.log("Scrapping Completed. Caching...");
        await dataController.cacheLabels();
        logger.log("Caching Completed.");
    });
}

console.log('Magic happens on ' + configs.PORT);

// youtubeScraper.scrapeStats();

twitterScraper.scrape();

exports = module.exports = app;