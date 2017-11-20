
// set config first
if (process.argv.length >= 3) {
    const config_env = process.argv[2];
    process.env.NODE_ENV = config_env;
}
const config = require('config');

const express = require('express');
const morgan  = require('morgan')
const logger  = require('logger').createLogger();
const cors = require('cors')
const schedule = require('node-schedule');
const app = express();
const routes = require('./routes/routes');
const bodyParser = require('body-parser')
const router = express.Router();
const twitterScraper = require('./controllers/twitterScraper');
const youtubeScraper = require('./controllers/youtubeScraper');
const dataController = require('./controllers/dataController');

logger.setLevel(config.get("Logger.level"));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.set('view engine', 'pug');
app.use(morgan('tiny'));
app.use(express.static('public'));

// allow cros
app.use(cors());

app.use('/api', routes.api);
app.use('/', routes.view);
app.use('/manage', routes.dashboard);

const port = config.get("Server.port")

app.listen(port);

logger.debug(JSON.stringify(config, null, 2));

// run schedule job
if (config.get("Scraper.schedule_scraping")) {
    logger.debug("schedule jobs");
    schedule.scheduleJob(config.get("Scraper.content_freq"), async () => {
        logger.log("Scraping New Videos...");
        await youtubeScraper.scheduleScraping();
        logger.log("Monitering Twitter Mentions...");
        await twitterScraper.scrape();
        logger.log("Scrapping Completed. Caching...");
        await dataController.cacheLabels();
        logger.log("Caching Completed.");
        await youtubeScraper.scrapeStats();
        logger.log("Stats Update Completed.");
    });
}


console.log('Magic happens on ' + port);

exports = module.exports = app;