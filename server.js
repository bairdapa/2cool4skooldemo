// include dependencies
var express = require('express');
var handlebars = require('express-handlebars').create({defaultLayout:'page'});
var path = require('path');
var mysql = require('./dbcon.js');
var url = require('url');
var bodyParser = require('body-parser');

// dictionary of currently logged in users
var sessions = {}


// set up app
var app = express();
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.argv[2]);

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


// helper functions
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
			if(sessions[session_key].expiry < Date.now()) {
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

// create professor page
app.get('/createprofessor', function(req, res, next) {
	var getSchoolsQuery = "SELECT Schools.schoolId, Schools.schoolName FROM Schools WHERE 1";
	var getWorldsQuery = "SELECT Worlds.worldId, Worlds.worldName FROM Worlds WHERE 1";

	mysql.pool.query(getSchoolsQuery, function(err, rows, fields) {
		if(err) {
			console.log("sql error while getting list of schools");
			console.log(err);
			res.status(500).end();
		}
		else {
			var schools = rows;

			mysql.pool.query(getWorldsQuery, function(err, rows, fields) {
				if(err) {
					console.log("sql error while getting list of worlds");
					console.log(err);
					res.status(500).end();
				}
				else {
					res.status(200).render('createprofessor', {
						worlds: rows,
						schools: schools
					});
				}
			});
		}
	});
});

// create professor action
app.post('createprofessor', function(req, res, next) {
	var data1 = [req.body.fname, req.body.lname, req.body.pic, req.body.school, req.body.world];
	var data2 = [req.body.fname, req.body.lname]

	var createProfQuery = "INSERT INTO Professors (fName, lName, pictureURL, schoolId, worldId) VALUES ( ? , ? , ? , ? , ? )";
	var getProfQuery = "SELECT professorId FROM Professors WHERE fName = ? AND lName = ?";

	mysql.pool.query(createProfQuery, data1, function(err, rows, fields) {
		if(err) {
			console.log("error creating professor");
			console.log(err);
			res.status(500).end();
		}
		else {
			mysql.pool.query(getProfQuery, data2, function(err, rows, fields) {
				if(err) {
					console.log("error looking up professor after creating");
					console.log(err);
				}
				else {
					res.status(200).json({
						id: rows[0].professorId	
					});
				}
			});
		}
	});
});

// create school page
app.get('/createschool', function(req, res, next) {
	var getWorldsQuery = "SELECT Worlds.worldId, Worlds.worldName FROM Worlds WHERE 1";

	mysql.pool.query(getWorldsQuery, function(err, rows, fields) {
		if(err) {
			console.log("sql error while getting list of worlds");
			console.log(err);
			res.status(500).end();
		}
		else {
			res.status(200).render('createschool', {
				worlds: rows
			});
		}
	});
});

// create schools action
app.post('createschool', function(req, res, next) {
	var data = [req.body.name, req.body.pic, req.body.world];

	var createSchoolQuery = "INSERT INTO Schools (schoolName, pictureURL, worldId) VALUES ( ? , ? , ? )";
	var getSchoolQuery = "SELECT schoolId FROM Schools WHERE schoolName = ?";

	mysql.pool.query(createSchoolQuery, data, function(err, rows, fields) {
		if(err) {
			console.log("error creating school");
			console.log(err);
			res.status(500).end();
		}
		else {
			mysql.pool.query(getSchoolQuery, req.body.name, function(err, rows, fields) {
				if(err) {
					console.log("error looking up school after creating");
					console.log(err);
				}
				else {
					res.status(200).json({
						id: rows[0].schoolId
					});
				}
			});
		}
	});
});


// login request
app.get('/loginrequest', function(req, res, next) {
	var url_params = url.parse(req.url, true).query;
	var searchQueryString = "SELECT Users.userId FROM Users WHERE Users.fName = ? AND Users.lNAme = ?";

	responseJSON = {
		success: false,
		user: "",
		id: -1,
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
			var new_session_val = {
				expiry: Date.now() + (1000*60*60),
				id: rows[0].userId
			};

			sessions[new_key] = new_session_val;
			responseJSON.success = true;
			responseJSON.user = url_params.fname + " " + url_params.lname;
			responseJSON.session_key = new_key;
			responseJSON.id = rows[0].userId;
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

// create account action
app.post('/createaccount', function(req, res, next) {
	data1 = [req.body.fname, req.body.lname, req.body.bio, req.body.pic];
	data2 = [req.body.fname, req.body.lname];

	var createAccQuery = "INSERT INTO Users (fName, lName, biography, pictureURL, worldId) VALUES ( ? , ? , ? , ?, 6)";
	var getUserQuery = "SELECT userID FROM Users WHERE fName = ? AND lName = ?";

	responseJSON = {
		success: false,
		user: req.body.fname + " " + req.body.lname,
		id: -1,
		session_key: null
	};

	mysql.pool.getConnection(function(err, connection) {
		connection.beginTransaction(function(err) {
			if(err) { //transaction error
				connection.rollback(function() {
					connection.release();
					console.log("error init transaction:\n" + err);
				});
			}
			else {
				connection.query(createAccQuery, data1, function(err, results) {
					if(err) { //transaction error
						connection.rollback(function() {
							connection.release();
							console.log("error q1 of transaction:\n" + err + "\n" + data1);
						});
					}
					else {
						connection.query(getUserQuery, data2, function(err, results) {
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
										var new_key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
										var new_session_val = {
											expiry: Date.now() + (1000*60*60),
											id: results[0].userId
										};

										sessions[new_key] = new_session_val;
										responseJSON.success = true;
										responseJSON.session_key = new_key;
										responseJSON.id = results[0].userId;
										res.status(200).json(responseJSON);

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
});

// browse professors
app.get('/browseprofessors', function(req, res, next) {
	var getProfessorsQuery = "SELECT Professors.professorId, Professors.schoolId, Professors.worldId, Professors.fName, Professors.lName, Professors.pictureURL, Schools.schoolName, Worlds.worldName FROM Professors INNER JOIN Worlds ON Worlds.worldId = Professors.WorldId INNER JOIN Schools ON Schools.schoolId = Professors.schoolId WHERE 1";

	mysql.pool.query(getProfessorsQuery, function(err, rows, fields) {
		if(err) {
			console.log("error fetching professor list");
			console.log(err);
		}
		else
		{
			for(var i = 0; i < rows.length; i++)
			{
				rows[i].link = 'href=professorreviews?id=' + rows[i].professorId;
			}
			res.status(200).render('browseprofessors', {
				results: rows
			});
		}
	});
});

// browse schools
app.get('/browseschools', function(req, res, next) {
	var getSchoolsQuery = "SELECT * FROM Schools INNER JOIN Worlds ON Worlds.worldId = Schools.worldId WHERE 1";

	mysql.pool.query(getSchoolsQuery, function(err, rows, fields) {
		if(err) {
			console.log("error fetching school list");
			console.log(err);
		}
		else
		{
			for(var i = 0; i < rows.length; i++)
			{
				rows[i].link = 'href=schoolreviews?id=' + rows[i].schoolId;
			}
			res.status(200).render('browseschools', {
				results: rows
			});
		}
	});
});

// create review
app.get('/createreview',function(req, res, next) {
	res.status(200);
	res.render('createreview');
});

// update an existing review
app.post('/updatereview', function(req, res, next) {
	if(!check_session_key(req.body.session_key)) {
		res.status(403).end();
		return;
	}

	data = [parseInt(req.body.rating), req.body.justification, parseInt(req.body.review_id)];

	var getIdQueryString = "SELECT userId FROM Reviews WHERE reviewId = ?";
	var updateQueryString = "UPDATE Reviews SET rating = ? , justification = ? WHERE reviewId = ?";

	mysql.pool.query(getIdQueryString, req.body.review_id, function(err, rows, fields) {
		if(err) {
			console.log("error getting id of review for update");
			console.log(err);
			res.status(500).end();
		}
		else {
			if(rows.length > 0) {
				if(sessions[req.body.session_key].id == rows[0].userId) {
					mysql.pool.query(updateQueryString, data, function(err, rows, fields) {
						if(err) {
							console.log("error updating review");
							console.log(err);
							res.status(500).end();
						}
						else {
							res.status(200).end();
						}
					});
				}
			}
		}
	});
});

// create review post request
app.post('/createreview', function(req, res, next) {
	if(!check_session_key(req.body.session_key)) {
		res.status(403).end();
		return;
	}

	var createReviewQueryString;
	var createIntersectionQueryString;

	var userId = sessions[req.body.session_key].id;

	var data1 = [parseInt(req.body.review_rating), req.body.justification, userId, parseInt(req.body.target_id)];
	var data2 = [userId, parseInt(req.body.target_id)];
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
						rows[i].ratingNum = rows[i].rating;
						rows[i].rating = convert_rating(rows[i].rating);
						rows[i].link = "user?id=" + rows[i].userId;
					}
					sdata.avgRating = 'Average Rating: ' + convert_rating(Math.ceil(rating_counter / rows.length));

					res.status(200);
					res.render('schoolreviews', {
						results: rows,
						schooldata: sdata
					});
				}
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
						rows[i].ratingNum = rows[i].rating;
						rows[i].rating = convert_rating(rows[i].rating);
						rows[i].link = "user?id=" + rows[i].userId;
					}
					pdata.avgRating = 'Average Rating: ' + convert_rating(Math.ceil(rating_counter / rows.length));

					res.status(200);
					res.render('professorreviews', {
						results: rows,
						profdata: pdata
					});
				}
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
	var url_params = url.parse(req.url, true).query;

	var reviewQueryString = "SELECT Professors.fName, Professors.lName, Professors.pictureURL AS profPictureURL, Schools.pictureURL, Reviews.rating, Reviews.justification, Reviews.professorId, Reviews.schoolId, Reviews.userId, Schools.schoolName FROM Reviews LEFT JOIN Professors ON Professors.professorId = Reviews.professorId LEFT JOIN Schools ON Schools.schoolId = Reviews.schoolId INNER JOIN Users ON Users.userID = Reviews.userId WHERE Reviews.userId= ?";
	var userQueryString = "SELECT Users.pictureURL, Users.fName, Users.lName, Users.biography, Worlds.worldName FROM Users INNER JOIN Worlds ON Worlds.worldId = Users.worldId WHERE Users.userId = ?";

	var udata = {};

	if (url_params.id == null){
		res.status(404).render('404');
		return;
	}

	mysql.pool.query(userQueryString, url_params.id, function(err, rows, fields) {
		if(err) {
			console.log("sql error on userreviews endpoint:\n");
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
			udata = rows[0];

			mysql.pool.query(reviewQueryString, url_params.id, function(err, rows, fields) {
				if(err) {
					console.log("sql error on userreviews endpoint:\n");
					console.log(err);
					res.status(500).render('500');
				}
				else
				{
					for (var i = 0; i < rows.length; i++)
					{
						rows[i].ratingNum = rows[i].rating;
						rows[i].rating = convert_rating(rows[i].rating);
						if(rows[i].profPictureURL != null) {
							rows[i].pictureURL = rows[i].profPictureURL;
							rows[i].link = "professorreviews?id=" + rows[i].professorId;
						}
						else
						{
							rows[i].fName = rows[i].schoolName;
							rows[i].link = "schoolreviews?id=" + rows[i].schoolId;
						}
					}
					res.status(200);
					res.render('user', {
						results: rows,
						userdata: udata
					});
				}
			});
		}
	});
});


// catch errors (404 and 500)
app.use(function(req,res){
	console.log(req);
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
