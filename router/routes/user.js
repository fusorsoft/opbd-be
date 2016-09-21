var mongoose = require('mongoose');
var express = require('express'),
	router = express.Router();


module.exports = function(passport, auth) {

	router.get('/:userid/Profile', auth.isAuthenticated, function(req, res) {
		var userid = req.params.userid;

		res.render('profile', {
			title: 'Profile',
			user: req.user,
			userid: userid,
		});
	});

	router.get('/:userid', function(req, res) {
		var userid = req.params.userid;
		res.render('matchData', {
			title: 'Match Data',
			user: req.user,
			userid: userid,
		});
	});

	router.get('/Logout', function(req, res) {
		// allow logout on GET because why not
		req.logOut();
		res.redirect("/");
	});

	// GET (new user form)
	router.get('/New', function(req, res) {
		res.render('newAccount', {
			title: 'Create Account',
			user: req.user,
		});
	});

	// POST (create user)
	router.post('/New', passport.authenticate('signup', {
		successRedirect: '/',
		failureRedirect: '/',
		failureFlash: true
	}));

	router.post('/Login', passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/',
		failureFlash: true
	}));

	// steam/openID
	router.get('/Login/Steam', passport.authenticate('steam'), function(req, res) {
		// The request will be redirected to Steam for authentication, so
		// this function will not be called.
	});

	router.get('/Login/Steam/Return', function(req, res, next) {
		passport.authenticate('steam', function(err, user, info) {
			//failureRedirect: '/sign'
			var redirectUrl = '/User/' + user.steamID;

			if (err) { return next(err); }
			if (!user) { return res.redirect('/signin'); }

			if (req.session.redirectUrl) {
				redirectUrl = req.session.redirectUrl;
				req.session.redirectUrl = null;
			}

			req.logIn(user, function(err) {
				if (err) { return next(err); }
			});

			res.redirect(redirectUrl);
		})(req,res,next);
	});

	return router;
};