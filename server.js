// include dependencies
var express = require('express');
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var path = require('path');
var mysql = require('./dbcon.js');


// set up app
var app = express();
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.argv[2]);

app.use(express.static('public'));

/* 
 * Endpoints
 */

// index
app.get('/', function(req, res, next) {
	res.render('index');
});

// login
app.get('/login',function(req, res, next) {
	res.render('login');
});

// create account
app.get('/createaccount',function(req, res, next) {
	res.render('createaccount');
});

// create review
app.get('/createreview',function(req, res, next) {
	res.render('createreview');
});

// professors
app.get('/professors',function(req, res, next) {
	res.render('professors');
});

// reviews
app.get('/reviews',function(req, res, next) {
	res.render('reviews');
});

// schools
app.get('/schools',function(req, res, next) {
	res.render('schools');
});

// user
app.get('/user',function(req, res, next) {
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
