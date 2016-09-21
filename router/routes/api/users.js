var express = require('express');
var router = express.Router();
var User = require('../../../data/User.js');
var EmailConfirmation = require('../../../data/EmailConfirmation.js');
var Q = require('q');

module.exports = function(passport, auth) {

	router.get('/top', function(req, res) {

		var limit = parseInt(req.query.limit);

		if (!Number.isInteger(limit)) {
			res.status(400).json({
				'error': 'limit must be an integral value'
			}).end();
		}
		//var limit = Number.isInteger(req.query.limit) ? parseInt(req.query.limit) : 10;

		User.getTopUsers(limit).then(function(data) {
			res.status(200).json(data).end();
		}, function(err) {
			res.status(500).json({
				'error': 'error retrieving top users'
			}).end();
		});
	});

	// get friend information for the specified user...

	router.get('/:userid/friends', function(req, res) {
		User.getFriends(req.params.userid)
		.then(function(friendData) {

			res.status(200).json(friendData).end();
		}, function(err) {
			res.status(500).json({
				'error': 'error retrieving information for user'
			}).end();
		});
	});

	router.get('/:userid', function(req, res) {
		User.getUserInfoByUserId(req.params.userid).then(function(data) {
			if (data === null) {
				res.status(204).end();
			} else {
				res.status(200).json(data).end();
			}

			return;
		}, function(err) {
			res.status(500).json({
				'error': 'error retrieving information for user'
			}).end();
		});


	});

	router.get('/', auth.apiIsAuthenticated, function(req, res) {
		User.getUserInfoByUserId(req.user.steamID).then(function(d) {
			res.status(200).json(d).end();
		}, function(err) {
			res.status(500).json({
				'error': 'error retrieving information for current user'
			}).end();
		});
	});

	router.post('/:userid/friends', auth.apiIsAuthenticated, function(req, res) {
		if (req.user.steamID !== req.params.userid) {
			res.status(403).json({
				'message': 'cannot add to another user\'s friends list ya dingus'
			}).end();
		} else {
			User.addFriend(req.params.userid, req.body.steamId, req.body.name)
			.then(function(data) {
				res.status(201).json({
					'message': 'friend added'
				}).end();
			}, function(error) {
				if (error.location) {
					res.status(409).set('Location', error.conflictUri).json({
						error: 'Already exists in friends list'
					}).end();
				} else {
					res.status(500).json({
						error: 'Error adding friend'
					}).end();
				}
			});
		}
	});

	router.post('/:userid/email', auth.apiIsAuthenticated, function(req,res) {
		if (req.user.steamID !== req.params.userid) {
			res.status(403).json({
				'message': 'Cannot modify another user\'s email'
			}).end();
		} else {
			EmailConfirmation.setConfirmation(req.body.email, req.params.userid, req.user.username).then(function(outcome) {
				if (outcome === 'updated') {
					res.status(204).end();
				} else if (outcome === 'created') {
					res.status(201).end();
				}
			}, function(err) {
				var status = null;

				// check if this is a rate limit error...
				var limitedIndex = -1;
				var isLimited = err.some(function(e, index) {
					
					if (e.message.indexOf('Too many tries') > -1) {
						limitedIndex = index;
						return true;
					}
				});

				if (isLimited) {
					status = 429;
					res.set('Retry-After', err[limitedIndex].resolvesAt);
				} else {
					status = 400;
				}
				res.status(status).json(err).end();
			});
		}
	});

	router.post('/:userid/roles', auth.isAuthenticated, auth.isAuthorized('admin'), function(req, res) {
		var userid = req.params.userid;
		var roles = req.body.roles;
		User.updateRoles(userid, roles).then(function() {
			res.status(204).end();
		}, function(err) {
			var status = 500;

			if (err.message && err.message.indexOf('unknown role') > -1) {
				status = 400;
			}
			res.status(status).json(err).end();
		});
	});

	router.delete('/:userid/friends/:friendId', auth.apiIsAuthenticated, function(req, res) {
		if (req.user.steamID !== req.params.userid) {
			res.status(401).json({
				'message': 'cannot remove someone else\'s friends'
			}).end();
		} else {
			User.removeFriend(req.params.userid, req.params.friendId)
			.then(function() {
				res.status(204).end();
			}, function(err) {
				res.status(500).end();
			});
		}
	});

	return router;
};