'use strict'


const url = require('url').URL;
const fetch = require('node-fetch');
const assert = require('assert');

const midleware = require('../middlewares/midlewares.js');


module.exports = function(app, db) {
  app.post('/get-declarations', 

    ...midleware.validateInitials,

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
  ),


  app.post('/get-public-person',

    ...midleware.validateInitials,

    (req, res) => {
      db.collection('pepPersons')
        .find({
          first_name: req.body.firstName.trim(),
          last_name: req.body.lastName.trim(),
          patronymic: req.body.patronymic.trim(),
          is_pep: true
        })
        .toArray(function(err, result) {
          assert.strictEqual(null, err);

          result && result.length > 0
            ? res.status(200).send(result)
            : res.status(404).send({ errors: [
                { msg: 'Публiчну особу за ФИО не знайдено', params: 'not found' }
              ]});
        });
  }),

  
  app.post('/get-related-persons/', 
    
    ...midleware.validateEdrpou,

    (req, res) => {
      db.collection('pepPersons')
        .find({
          is_pep: true,
          related_companies: { $elemMatch: {to_company_edrpou: req.body.edrpou} },
        })
        .toArray(function(err, result) {
          assert.strictEqual(null, err);

          result && result.length > 0
            ? res.status(200).json(result)
            : res.status(404).send({ 
                msg: 'Публiчних осiб за вказаним ЄДРПОУ не знайдено', params: 'not found' 
              });
        });
  });

  app.post('/get-person-sunctions/', 
    
    ...midleware.validatePerson,

    (req, res) => {
      db.collection('personSunctions')
        .find({ $text: { 
          $search: `"${req.body.lastName} ${req.body.firstName} ${req.body.patronymic || ''}"` } 
        })
        .toArray(function(err, result) {
          assert.strictEqual(null, err);

          result && result.length > 0
            ? res.status(200).json(result)
            : res.status(404).send({ 
                msg: 'Публiчних осiб за вказаним ЄДРПОУ не знайдено', params: 'not found' 
              });
        });
    });

  app.post('/get-legal-sunctions/', 
  
    ...midleware.validateLegal,

    (req, res) => {
      db.collection('legalSunctions')
        .find({ $text: { $search: `"${req.body.edrpou}"` } })
        .toArray(function(err, result) {
          assert.strictEqual(null, err);

          result && result.length > 0
            ? res.status(200).json(result)
            : res.status(404).send({ 
                msg: 'Публiчних осiб за вказаним ЄДРПОУ не знайдено', params: 'not found' 
              });
        });
    });
}