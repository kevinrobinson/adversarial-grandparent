// server.js
// where your node app starts

// init project
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json({limit: '1mb'})); // images can be ~200kb

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// init sqlite db
const db = loadOrCreateDatabase();

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// read the sqlite3 module docs and try to add your own! https://www.npmjs.com/package/sqlite3
app.post('/image', function(request, response) {
  console.log('got request.');
  const json = JSON.stringify(request.body);

  console.log(`  inserting ${json.length} bytes...`);
  db.run('INSERT INTO images (json, timestamp) VALUES ($json, $timestamp)', {
    $json: json,
    $timestamp: (new Date()).getTime()
  });
  
  // Return success no matter what
  response.set('Content-Type', 'application/json');
  response.json({ status: 'ok' });
  console.log('done.');
});

app.get('/images', function(request, response) {
  if (request.query.key !== process.env.VIEW_IMAGES_KEY) {
    response.json({nope: 'sorry'});
    return;
  }
  
  db.all('SELECT rowid, * FROM images ORDER BY rowid DESC LIMIT 10', (err, rows) => {
    response.set('Content-Type', 'application/json');
    response.json({rows});
    console.log('get /images: done.');
  });
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});


function loadOrCreateDatabase() {
  const fs = require('fs');
  const dbFile = './.data/sqlite.db';
  const exists = fs.existsSync(dbFile);
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database(dbFile);

  // if ./.data/sqlite.db does not exist, create it, otherwise print records to console
  db.serialize(function(){
    if (!exists) {
      db.run('CREATE TABLE images (json JSON, timestamp DATETIME)');
      console.log('New table created!');
      return;
    }

    console.log('Database "images" ready to go!');
  });

  return db;
}


// for debugging
/*
var err = null;
var rows = null;
var db = loadOrCreateDatabase();
db.all('SELECT rowid, * from images', function(e, r) {
  err = e;
  rows = r;
});
*/

