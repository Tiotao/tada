const express = require('express');
const dataCtrl = require('./controllers/dataController');
const tumblrScraper = require('./controllers/tumblrScraper');
const youtubeScraper = require('./controllers/youtubeScraper');

var router = express.Router();

router.route('/labels/top/').post(dataCtrl.getTopTumblrLabels);

router.route('/labels/time/').post(dataCtrl.getTumblrLabelScoreOverTime);

router.route('/youtube/scrape').get(youtubeScraper.scrape)

router.route('/scrape_tumblr').get(tumblrScraper.scrape);


module.exports = router;