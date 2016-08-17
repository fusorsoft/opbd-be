var mongoose = require('mongoose');
var express = require('express'),
	router = express.Router();

module.exports = function(passport, auth) {

	router.get('/', auth.isAuthenticated, auth.isAuthorized('admin'), function(req, res) {
		res.render('admin', {
			title: 'Admin',
			user: req.user,
		});
	});


	return router;
};