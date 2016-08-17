var Q = require('q');
var express = require('express'),
	router = express.Router();

var Feedback = require('../../../data/Feedback.js');

module.exports = function(passport, auth) {

	router.post('/feedback', auth.isAuthenticated, function(req, res) {

		Feedback.sendFeedback(req.user, req.body.subject, req.body.message, req.body.url).then(function() {
			res.status(201).end();
		}, function(err) {
			res.status(500).send(err).end();
		});
	});

	return router;
};