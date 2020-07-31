var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'classmysql.engr.oregonstate.edu',
  user            : 'cs340_bairdapa',
  password        : 'qnWBsvbD5jMPsMMQ',
  database        : 'cs340_bairdapa'
});

module.exports.pool = pool;
