const express = require('express');
const dataCtrl = require('../controllers/dataController');
const viewCtrl = require('../controllers/viewController');
const tumblrScraper = require('../controllers/tumblrScraper');
const youtubeScraper = require('../controllers/youtubeScraper');
const twitterScraper = require('../controllers/twitterScraper');



var api = express.Router();

api.route('/labels/tumblr/top/').post(dataCtrl.getTopTumblrLabels);

api.route('/labels/tumblr/time/').post(dataCtrl.getTumblrLabelScoreOverTime);

api.route('/labels/twitter/top/').post(dataCtrl.getTopTwitterLabels);

api.route('/labels/twitter/time/').post(dataCtrl.getTwitterLabelScoreOverTime);

api.route('/scrape_tumblr').get(tumblrScraper.scrape);

api.route('/labels/:id').get(dataCtrl.getOneLabel);

api.route('/videos/:id').get(dataCtrl.getOneVideo);

api.route('/labels').get(dataCtrl.getLabels);

api.route('/filter').post(dataCtrl.graphQuery);

var view = express.Router();


view.route('/').get(viewCtrl.renderInterface);

view.route('/dashboard').get(dataCtrl.manageLabels);

var dashboard = express.Router();

dashboard.route('/meta_label/list').get(dataCtrl.getMetaLabels);

dashboard.route('/meta_label/create').post(dataCtrl.createMetaLabel);

dashboard.route('/meta_label/delete').post(dataCtrl.deleteMetaLabel);

dashboard.route('/meta_label/labels').post(dataCtrl.getAssignedLabel);

dashboard.route('/label/unassigned/list').get(dataCtrl.getUnassignedLabels);

dashboard.route('/label/assign').post(dataCtrl.assignLabel);

dashboard.route('/label/unassign').post(dataCtrl.unassignLabel);

module.exports = {
    api: api,
    view: view,
    dashboard: dashboard
};