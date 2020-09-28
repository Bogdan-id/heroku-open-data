'use strict'

require('dotenv').config()
const utils = require('./utils/utils.js');

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());

app.use((req, res, next) => {
  utils.setHeaderToOrigin(res, req, next);
});

const entry = utils.options

const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(entry.url, entry.options);

client.connect(function(err) {
  if(err) { 
    console.log(err); 

    return; 
  };

  const db = client.db(entry.dbName);
  const col = db.collection(entry.dbCollection);

  console.log("Connected successfully to server");

  require('./routes/declaration-routes.js')(app, col);
})

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`App starting on port ${port}`);
});
