'use strict'

const url = require('url').URL;
const fetch = require('node-fetch');

const midleware = require('../middlewares/midlewares.js');

module.exports = function(app) {
  app.post('/get-declarations', 

    ...midleware.getDeclarations,

    (req, res) => {  

      const domain = 'https://declarations.com.ua/'
      const options = 'doc_type%5B%5D=Щорічна&format=opendata&sort=year_desc'

      const { lastName, firstName, patronymic } = req.body

      let declarUrl = new url(`${domain}search?q=${lastName}+${firstName}+${patronymic}&${options}`)

      fetch(declarUrl)
        .then(response => response.json())
        .then(val => res.send(val))
        .catch(err => res.send(err))
    }
  )
  // another route here
}