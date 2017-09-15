const express = require('express');
const morgan  = require('morgan')
const logger  = require('logger').createLogger();
const schedule = require('node-schedule');
const app = express();
const routes = require('./routes');
const c = require('constants');

const scrapeCtrl = require('./controllers/scrapeController');

app.set('view engine', 'pug');
app.use(morgan('tiny'));
app.use('/', routes);
app.listen('8081');

// run schedule job
if (c.SCHEDULE_SCRAPE) {
    schedule.scheduleJob(c.SCRAPE_TIME, scrapeCtrl.scrapeTumblr);
}

console.log('Magic happens on 8081');

exports = module.exports = app;