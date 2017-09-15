const express = require('express');
const dataCtrl = require('./controllers/dataController');
const scrapeCtrl = require('./controllers/scrapeController');

var router = express.Router();

router.route('/label/:start-:end').get(dataCtrl.getTopTumblrLabels);

router.route('/scrape_tumblr').get(scrapeCtrl.scrapeTumblr);


module.exports = router;