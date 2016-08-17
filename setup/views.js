var engine = require('ejs-locals');

module.exports = function(app) {	
	app.set('views', __dirname + '/../../frontend/views');
	app.set('view engine', 'ejs');
	app.engine('html', require('ejs').renderFile);
	app.engine('ejs', engine);
};