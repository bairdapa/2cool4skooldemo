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
app.get('/',function(req,res,next){
	res.render('index');
});

// more endpoints will be implemented here


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
