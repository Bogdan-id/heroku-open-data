'use strict'

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
  dbName: 'PepUkraine',
  dbCollection: 'pepPersons',
  url: `mongodb+srv://dataPep:dvaodin1233@pepukraine.zbumz.mongodb.net/${this.dbName}?retryWrites=true&w=majority`,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
}