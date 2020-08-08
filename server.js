// include dependencies
var express = require('express');
var handlebars = require('express-handlebars').create({defaultLayout:'page'});
var path = require('path');
var mysql = require('./dbcon.js');
var url = require('url');
var bodyParser = require('body-parser');

// set up login functionality
var sessions = {}


// set up app
var app = express();
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.argv[2]);

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

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

function check_session_key(session_key) {
	var valid = false;
	for(var key in sessions) {
		if(sessions.hasOwnProperty(key)) {
			if(sessions[session_key] < Date.now()) {
				delete sessions[session_key];
			}
			else
			{
				valid = true;
			}
		}
	}
	return valid;
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

// login request
app.get('/loginrequest', function(req, res, next) {
	var url_params = url.parse(req.url, true).query;
	var searchQueryString = "SELECT Users.userId FROM Users WHERE Users.fName = ? AND Users.lNAme = ?";

	responseJSON = {
		success: false,
		user: "",
		session_key: null
	};

	if(url_params.fname == null || url_params.lname == null) {
		res.status(200).json(responseJSON);	
		return;
	}

	mysql.pool.query(searchQueryString, [url_params.fname, url_params.lname], function(err, rows, fields) {
		if(err) {
			res.status(500).json(responseJSON);
			console.log("sql error while finding user to log in");
			console.log(err);
		}
		else if (rows.length > 0){
			var new_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
			sessions[new_key] = Date.now() + (1000*60*60);
			responseJSON.success = true;
			responseJSON.user = url_params.fname + " " + url_params.lname;
			responseJSON.session_key = new_key;
			res.status(200).json(responseJSON);
		}
		else {
			res.status(200).json(responseJSON);
		}
	});
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

// create review post request
app.post('/createreview', function(req, res, next) {
	var createReviewQueryString;
	var createIntersectionQueryString;

	var data1 = [parseInt(req.body.review_rating), req.body.justification, 17, parseInt(req.body.target_id)];
	var data2 = [17, parseInt(req.body.target_id)];
	if(req.body.review_type == "prof") {
		createReviewQueryString = "INSERT INTO Reviews (rating, justification, userId, schoolId, professorId) VALUES ( ? , ? , ? , NULL, ? )";
		createIntersectionQueryString = "INSERT INTO UserProfessorIntersections (reviewId, userId, professorId) VALUES ((SELECT reviewId FROM Reviews WHERE reviewId = @@Identity), ? , ? )";
	}
	else {
		createReviewQueryString = "INSERT INTO Reviews (rating, justification, userId, schoolId, professorId) VALUES ( ? , ? , ? , ? , NULL);";
		createIntersectionQueryString = "INSERT INTO UserSchoolIntersections (reviewId, userId, schoolId) VALUES ((SELECT reviewId FROM Reviews WHERE reviewId = @@Identity), ? , ? );";
	}

	mysql.pool.getConnection(function(err, connection) {
		connection.beginTransaction(function(err) {
			if(err) { //transaction error
				connection.rollback(function() {
					connection.release();
					console.log("error init transaction:\n" + err);
				});
			}
			else {
				connection.query(createReviewQueryString, data1, function(err, results) {
					if(err) { //transaction error
						connection.rollback(function() {
							connection.release();
							console.log("error q1 of transaction:\n" + err + "\n" + data1);
						});
					}
					else {
						connection.query(createIntersectionQueryString, data2, function(err, results) {
							if(err) { //transaction error
								connection.rollback(function() {
									connection.release();
									console.log("error q2 of transaction:\n" + err + "\n" + data2);
								});
							}
							else {
								connection.commit(function(err) {
									if(err) { //transaction error
										connection.rollback(function() {
											connection.release();
											console.log("error commit transaction:\n" + err);
										});
									}
									else {
										connection.release();
									}
								});
							}
						});
					}
				});
			}
		});
	});

	res.status(200).json(req.body);
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
app.get('/searchschools',function(req, res, next) {
	var url_params = url.parse(req.url, true).query;

	var searchQueryString = "SELECT Schools.schoolId FROM Schools WHERE schoolName = ?";

	var responseJSON = {
		found: false,
		id: -1
	};

	if(url_params.schoolname == null)
	{
		res.status(200).json(responseJSON);	
		return;
	}

	mysql.pool.query(searchQueryString, url_params.schoolname, function(err, rows, fields) {
		if(err) {
			console.log("sql error in school search endpoint:\n");
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
			responseJSON.id = rows[0].schoolId;
			res.status(200).json(responseJSON);
		}
	});
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

// delete review
app.get('/deletereview', function(req, res, next) {
	var url_params = url.parse(req.url, true).query;
	var reviewTypeQueryString = "SELECT Reviews.professorId FROM Reviews WHERE Reviews.reviewId = ?";
	var deleteQueryString1;
	var deleteQueryString2 = "DELETE FROM Reviews WHERE Reviews.reviewId = ?";

	if(check_session_key(url_params.session_key)) {
		mysql.pool.query(reviewTypeQueryString, url_params.id, function(err, rows, fields) {
			if(err) {
				console.log("sql error detecting review type for deletion");
				console.log(err);
			}
			else
			{
				if(rows[0].professorId != null) {
					// prof review
					deleteQueryString1 = "DELETE FROM UserProfessorIntersections WHERE reviewId = ?"
				}
				else {
					// school review
					deleteQueryString1 = "DELETE FROM UserSchoolIntersections WHERE reviewId = ?"
				}


				mysql.pool.getConnection(function(err, connection) {
					connection.beginTransaction(function(err) {
						if(err) { //transaction error
							connection.rollback(function() {
								connection.release();
								console.log("error init transaction:\n" + err);
							});
						}
						else {
							connection.query(deleteQueryString1, url_params.id, function(err, results) {
								if(err) { //transaction error
									connection.rollback(function() {
										connection.release();
										console.log("error q1 of transaction:\n" + err);
									});
								}
								else {
									connection.query(deleteQueryString2, url_params.id, function(err, results) {
										if(err) { //transaction error
											connection.rollback(function() {
												connection.release();
												console.log("error q2 of transaction:\n" + err);
											});
										}
										else {
											connection.commit(function(err) {
												if(err) { //transaction error
													connection.rollback(function() {
														connection.release();
														console.log("error commit transaction:\n" + err);
													});
												}
												else {
													connection.release();
													res.status(200).end();
												}
											});
										}
									});
								}
							});
						}
					});
				});
			}
		});
	}
	else {
		res.status(403).end();
	}
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
