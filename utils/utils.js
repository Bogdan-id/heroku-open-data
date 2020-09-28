'use strict'

require('dotenv').config()

exports.setHeaderToOrigin = function (res, req, next) {
  
  const origin = req.headers.origin
  let allowOrigin = [
    'http://localhost:8080',
    'https://fervent-agnesi-d2138f.netlify.app'
  ];

  if(allowOrigin.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
  } 

  next()
}

exports.options = {
  dbName: process.env.DB_NAME,
  dbCollection: process.env.DB_COLLECTION,
  url: `mongodb+srv://dataPep:${process.env.DB_PASSWORD}@pepukraine.zbumz.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
}