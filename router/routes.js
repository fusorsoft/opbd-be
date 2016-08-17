var auth = require('./auth')();
var settings = require('../../settings')();
var EmailConfirmation = require('../data/EmailConfirmation.js');

module.exports = function(app, passport) {

	app.use('/User', require('./routes/user')(passport, auth));
	app.use('/Admin', require('./routes/admin')(passport, auth));
	app.use('/_api/matchdata', require('./routes/api/matchdata')(passport, auth));
	app.use('/_api/users', require('./routes/api/users')(passport, auth));
	app.use('/_api/breakdown', require('./routes/api/breakdown')(passport, auth));
	app.use('/_api/admin', require('./routes/api/admin')(passport, auth));
	//app.use('/_api/sandbox', require('./routes/api/sandbox')(passport, auth));

	app.get('/', function(req, res) {
		res.render('index', {
			title: 'Home',
			user: req.user,
		});
	});

	app.get('/about', function(req, res) {
		res.render('about', {
			title: 'About Operation Breakdown',
			user: req.user,
		});
	});

	app.get('/privacy', function(req, res) {
		res.render('privacy', {
			title: 'Privacy Policy',
			user: req.user,
		});
	});

	app.get('/news', function(req, res) {
		res.render('news', {
			title: 'News',
			user: req.user,
		});
	});

	app.get('/credits', function(req, res) {
		res.render('credits', {
			title: 'Credits',
			user: req.user,
		});
	});
	
	app.get('/donate', function(req, res) {
		res.render('donate', {
			title: 'Donate',
			user: req.user,
		});
	});

	app.get('/signin', function(req, res) {
		res.render('signin', {
			title: 'Sign In',
			user: req.user,
		});
	});

	app.get('/beta', function(req, res) {
		res.render('beta', {
			title: 'Closed Beta',
			user: req.user
		});
	});

	app.get('/emailConfirmed', function(req, res) {
		res.render('emailConfirmed', {
			title: 'Email Confirmed',
			user: req.user
		});
	});

	app.get('/confirmEmail', function(req, res) {
		if (!req.query.token) {
			res.status(400).json({message: 'Bad Token'}).end();
		}

		EmailConfirmation.confirmEmail(req.query.token).then(function() {
			res.status(204).redirect('/emailConfirmed');
		}, function(err) {
			if (err === "Bad token") {
				res.status(400).redirect('/error');
			} else {
				res.status(500).redirect('/error');
			}
		});
	});
};