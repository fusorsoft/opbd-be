var express = require('express');
var router = express.Router();
var User = require('../../../data/User.js');
var EmailConfirmation = require('../../../data/EmailConfirmation.js');
var Q = require('q');

module.exports = function(passport, auth) {

	// get friend information for the specified user...

	router.get('/:userid/friends', auth.apiIsAuthenticated, function(req, res) {
		User.getFriends(req.params.userid)
		.then(function(friendData) {

			res.status(200).json(friendData).end();
		}, function(err) {
			res.status(500).json({
				'error': 'error retrieving information for user'
			}).end();
		});
	});

	router.get('/:userid', auth.apiIsAuthenticated, function(req, res) {
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