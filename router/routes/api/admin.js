var Q = require('q');
var express = require('express'),
	router = express.Router();

var User = require('../../../data/User.js');

module.exports = function(passport, auth) {

	router.get('/users', auth.isAuthenticated, auth.isAuthorized('admin'), function(req, res) {
		User.getUsers().then(function(data) {
			res.status(200).send(data).end();
		}, function(err) {
			res.status(500).send(err).end();
		});
	});

	return router;
};