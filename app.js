'use strict'

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const origin = require('./utils/allow-origins.js');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());

app.use((req, res, next) => {

  origin.setHeaderToOrigin(res, req.headers.origin);

  next();
});

require('./routes/declaration-routes.js')(app);

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`App starting on port ${port}`);
});
