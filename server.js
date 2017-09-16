const express = require('express');
const morgan  = require('morgan')
const logger  = require('logger').createLogger();
const schedule = require('node-schedule');
const app = express();
const routes = require('./routes');
const configs = require('./configs');
const bodyParser = require('body-parser')
const router = express.Router();

const scrapeCtrl = require('./controllers/scrapeController');


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.set('view engine', 'pug');
app.use(morgan('tiny'));
app.use('/api', routes);
app.listen('8081');


logger.debug(configs);

// run schedule job
if (configs.SCHEDULE_SCRAPE) {
    logger.debug("schedule jobs");
    schedule.scheduleJob(configs.SCRAPE_TIME, scrapeCtrl.scheduleScraping);
}

console.log('Magic happens on 8081');

exports = module.exports = app;