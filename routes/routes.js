const express = require('express');
const dataCtrl = require('../controllers/dataController');
const tumblrScraper = require('../controllers/tumblrScraper');
const youtubeScraper = require('../controllers/youtubeScraper');
const twitterScraper = require('../controllers/twitterScraper');

var api = express.Router();

api.route('/labels/tumblr/top/').post(dataCtrl.getTopTumblrLabels);

api.route('/labels/tumblr/time/').post(dataCtrl.getTumblrLabelScoreOverTime);

api.route('/labels/twitter/top/').post(dataCtrl.getTopTwitterLabels);

api.route('/labels/twitter/time/').post(dataCtrl.getTwitterLabelScoreOverTime);

api.route('/youtube/scrape').get(youtubeScraper.scrape)

api.route('/youtube/scrape/popular').get(youtubeScraper.scrapePopular)

api.route('/twitter/scrape').get(twitterScraper.scrape)

api.route('/scrape_tumblr').get(tumblrScraper.scrape);


api.route('/label/:id').get(dataCtrl.getOneLabel);

api.route('/video/:id').get(dataCtrl.getOneVideo);

var view = express.Router();

view.route('/').get(youtubeScraper.scrapePopular);

view.route('/pixel').get(dataCtrl.getPixels);

module.exports = {
    api: api,
    view: view
};