const mysql = require('mysql');
const dsl=require('./dsl.json');

const conn = mysql.createConnection({
    host: dsl.db.host,
    user:dsl.db.user,
    password:dsl.db.password,
    database: dsl.db.database,
    port: dsl.db.port,
});

conn.connect((err) => {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
   
    console.log('DB Started'); 
  });


  module.exports = conn;