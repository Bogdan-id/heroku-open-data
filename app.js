'use strict'

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const utils = require('./utils/utils.js');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());

app.use((req, res, next) => {
  utils.setHeaderToOrigin(res, req.headers.origin);
  next();
});

const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(utils.options.url, utils.options.options);

client.connect(function(err) {
  if(err) { 
    console.log(err); 

    return; 
  };

  const db = client.db(utils.options.dbName);
  const col = db.collection(utils.options.dbCollection);

  console.log("Connected successfully to server");

  require('./routes/declaration-routes.js')(app, col);
})

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`App starting on port ${port}`);
});
