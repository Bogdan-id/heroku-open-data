'use strict'

exports.setHeaderToOrigin = function (res, origin) {
  
  let allowOrigin = [
    'http://127.0.0.1:8000',
    'http://127.0.0.1:8001',
    'http://localhost:8080', 
    'http://localhost:8081',
    'http://localhost:3000',
    'http://localhost:8080'
  ];

  if(allowOrigin.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
  } 
}
