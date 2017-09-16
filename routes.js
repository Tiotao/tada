const express = require('express');
const dataCtrl = require('./controllers/dataController');
const scrapeCtrl = require('./controllers/scrapeController');

var router = express.Router();

router.route('/labels/top/').post(dataCtrl.getTopTumblrLabels);

router.route('/labels/time/').post(dataCtrl.getTumblrLabelScoreOverTime);

router.route('/scrape_tumblr').get(scrapeCtrl.scrapeTumblr);


module.exports = router;