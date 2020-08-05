// include dependencies
var express = require('express');
var handlebars = require('express-handlebars').create({defaultLayout:'page'});
var path = require('path');
var mysql = require('./dbcon.js');
var url = require('url');


// set up app
var app = express();
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.argv[2]);

app.use(express.static('public'));

function convert_rating(rating) {
	switch(rating) {
		case 0:
			return "☆☆☆☆☆";
		case 1:
			return "★☆☆☆☆";
		case 2:
			return "★★☆☆☆";
		case 3:
			return "★★★☆☆";
		case 4:
			return "★★★★☆";
		case 5:
			return "★★★★★";
	}
	return "☆☆☆☆☆";
}

/* 
 * Endpoints
 */

// index
app.get('/', function(req, res, next) {
	res.status(200);
	res.render('index', {layout: 'home'});
});

// login
app.get('/login',function(req, res, next) {
	res.status(200);
	res.render('login');
});

// create account
app.get('/createaccount',function(req, res, next) {
	res.status(200);
	res.render('createaccount');
});

// create review
app.get('/createreview',function(req, res, next) {
	res.status(200);
	res.render('createreview');
});

// search professors
app.get('/professors',function(req, res, next) {
	res.status(200);
	res.render('professors');
});

// search schools
app.get('/schools',function(req, res, next) {
	res.status(200);
	res.render('schools');
});

// school reviews
app.get('/schoolreviews',function(req, res, next) {
	var queryString = "SELECT * FROM Reviews INNER JOIN Schools ON Schools.schoolId = Reviews.schoolId INNER JOIN Users ON Users.userID = Reviews.userId WHERE Reviews.schoolId=1;"
	
	mysql.pool.query(queryString, function(err, rows, fields) {
		if(err) {
			console.log("sql error on schoolreviews endpoint:\n");
			console.log(err);
			res.status(500).render('500');
		}
		else
		{
			for(var i = 0; i < rows.length; i++)
			{
				rows[i].rating = convert_rating(rows[i].rating);
			}
			res.status(200);
			res.render('schoolreviews', {
				results: rows	
			});
		}
	});
});

// professor reviews
app.get('/professorreviews',function(req, res, next) {
	var url_params = url.parse(req.url, true).query;

	var ratingQueryString = "SELECT * FROM Reviews INNER JOIN Professors ON Professors.professorId = Reviews.professorId INNER JOIN Users ON Users.userID = Reviews.userId WHERE Reviews.professorId = ?";
	var profQueryString = "SELECT Professors.pictureURL, Professors.fName, Professors.lName, Schools.schoolName, Worlds.worldName FROM Professors INNER JOIN Schools ON Schools.schoolId = Professors.schoolId INNER JOIN Worlds ON Worlds.worldId = Professors.worldId WHERE Professors.professorId = ?"

	var pdata = {};
	
	mysql.pool.query(profQueryString, url_params.id, function(err, rows, fields) {
		if(err) {
			console.log("sql error on professorreviews endpoint:\n");
			console.log(err);
			res.status(500).render('500');
			return;
		}
		else if (rows.length == 0)
		{
			res.status(404).render('404');
			return;
		}
		else
		{
			pdata = rows[0];
		}
	});
	
	mysql.pool.query(ratingQueryString, url_params.id, function(err, rows, fields) {
		if(err) {
			console.log("sql error on professorreviews endpoint:\n");
			console.log(err);
			res.status(500).render('500');
		}
		else
		{
			var rating_counter = 0;
			for(var i = 0; i < rows.length; i++)
			{
				rating_counter += rows[i].rating;
				rows[i].rating = convert_rating(rows[i].rating);
			}
			pdata.avgRating = convert_rating(Math.ceil(rating_counter / rows.length));
			res.status(200);
			res.render('professorreviews', {
				results: rows,
				profdata: pdata
			});
		}
	});
});

// user
app.get('/user',function(req, res, next) {
	res.status(200);
	res.render('user');
});


// catch errors (404 and 500)
app.use(function(req,res){
	res.status(404);
	res.render('404');
});

app.use(function(err, req, res, next){
	console.error(err.stack);
	res.status(500);
	res.render('500');
});


// start server
app.listen(app.get('port'), function(){
	console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
