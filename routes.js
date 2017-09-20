const express = require('express');
const dataCtrl = require('./controllers/dataController');
const tumblrScrapeCtrl = require('./controllers/tumblrScrapeController');

var router = express.Router();

router.route('/labels/top/').post(dataCtrl.getTopTumblrLabels);

router.route('/labels/time/').post(dataCtrl.getTumblrLabelScoreOverTime);

router.route('/scrape_tumblr').get(tumblrScrapeCtrl.scrape);


module.exports = router;