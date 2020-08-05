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
app.get('/searchprofessors',function(req, res, next) {
	var url_params = url.parse(req.url, true).query;

	var searchQueryString = "SELECT Professors.professorId FROM Professors WHERE Professors.fname = ? AND Professors.lname = ?";

	var responseJSON = {
		found: false,
		id: -1
	};

	if(url_params.fname == null || url_params.lname == null)
	{
		res.status(200).json(responseJSON);	
		return;
	}

	mysql.pool.query(searchQueryString, [url_params.fname, url_params.lname], function(err, rows, fields) {
		if(err) {
			console.log("sql error in prof search endpoint:\n");
			console.log(err);
			res.status(500).json(responseJSON);
			return;
		}	
		else if(rows.length == 0)
		{
			res.status(200).json(responseJSON);
			return;
		}
		else {
			responseJSON.found = true;
			responseJSON.id = rows[0].professorId;
			res.status(200).json(responseJSON);
		}
	});
});

// search schools
app.get('/schools',function(req, res, next) {
	res.status(200);
	res.render('schools');
});

// school reviews
app.get('/schoolreviews',function(req, res, next) {
	var url_params = url.parse(req.url, true).query;
	
	var reviewQueryString = "SELECT * FROM Reviews INNER JOIN Schools ON Schools.schoolId = Reviews.schoolId INNER JOIN Users ON Users.userID = Reviews.userId WHERE Reviews.schoolId = ?";
	var schoolQueryString = "SELECT * FROM Schools INNER JOIN Worlds ON Worlds.worldId = Schools.worldId WHERE Schools.schoolId = ?";

	var sdata = {};
	
	if(url_params.id == null)
	{
		res.status(404).render('404');
		return;
	}
		
	mysql.pool.query(schoolQueryString, url_params.id, function(err, rows, fields) {
		if(err) {
			console.log("sql error on schoolreviews endpoint:\n");
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
			sdata = rows[0];
		}
	});

	mysql.pool.query(reviewQueryString, url_params.id, function(err, rows, fields) {
		if(err) {
			console.log("sql error on schoolreviews endpoint:\n");
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
			sdata.avgRating = convert_rating(Math.ceil(rating_counter / rows.length));

			res.status(200);
			res.render('schoolreviews', {
				results: rows,
				schooldata: sdata
			});
		}
	});
});

// professor reviews
app.get('/professorreviews',function(req, res, next) {
	var url_params = url.parse(req.url, true).query;

	var reviewQueryString = "SELECT * FROM Reviews INNER JOIN Professors ON Professors.professorId = Reviews.professorId INNER JOIN Users ON Users.userID = Reviews.userId WHERE Reviews.professorId = ?";
	var profQueryString = "SELECT Professors.pictureURL, Professors.fName, Professors.lName, Schools.schoolName, Worlds.worldName FROM Professors INNER JOIN Schools ON Schools.schoolId = Professors.schoolId INNER JOIN Worlds ON Worlds.worldId = Professors.worldId WHERE Professors.professorId = ?";

	var pdata = {};

	if(url_params.id == null)
	{
		res.status(404).render('404');
		return;
	}
	
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
	
	mysql.pool.query(reviewQueryString, url_params.id, function(err, rows, fields) {
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
	console.log("general 500 error caught");
	console.error(err);
	res.status(500);
	res.render('500');
});


// start server
app.listen(app.get('port'), function(){
	console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
