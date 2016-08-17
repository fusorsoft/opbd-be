
module.exports = function(app, express) {
	//app.use(express.static('../frontend/static'));
	var staticDir = __dirname + '/../../frontend/static';
	app.use(express.static(staticDir));
};