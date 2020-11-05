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

  app.post('/get-edr-persons',
    ...midleware.validateInitials,
    (req, res) => {
      console.log(req.body)
      let person = req.body
      db.collection('edr')
        .find({
          $or: [
            {boss: { $in: [`${person.lastName} ${person.firstName} ${person.patronymic}`]}},
            {beneficialOwners: { $in: [`${person.lastName} ${person.firstName} ${person.patronymic}`]}},
            {founders: { $in: [`${person.lastName} ${person.firstName} ${person.patronymic}`]}}
          ]
        })
        .toArray(function(err, result) {
          console.log(result)
          assert.strictEqual(null, err);
          res.status(200).send(result)
        });
  }),

  app.post('/get-edr-legal',
    // ...midleware.validateLegal,
    (req, res) => {
      console.log(req.body)
      db.collection('edr')
        .find({edrpou: req.body.edrpou})
        .toArray(function(err, result) {
          console.log(result)
          assert.strictEqual(null, err);
          res.status(200).send(result);
        });
    }),

  app.post('/get-public-person',
    ...midleware.validateInitials,
    (req, res) => {
      console.log(req.body)
      db.collection('pepPersons')
        .find({
          $or: [
            {
              first_name: req.body.firstName.trim(),
              last_name: req.body.lastName.trim(),
              patronymic: req.body.patronymic.trim(),
              is_pep: true
            }
          ]
        })
        .toArray(function(err, result) {
          console.log(result)
          assert.strictEqual(null, err);
          res.status(200).send(result);
        });
  }),

  
  app.post('/get-related-persons/', 
    ...midleware.validateEdrpou,
    (req, res) => {
      console.log(req.body)
      db.collection('pepPersons')
        .find({
          is_pep: true,
          related_companies: { $elemMatch: {to_company_edrpou: req.body.edrpou} },
        })
        .toArray(function(err, result) {
          console.log(result)
          assert.strictEqual(null, err);
          res.status(200).json(result)
        });
  });

  app.post('/get-person-sanctions/', 
    ...midleware.validatePerson,
    (req, res) => {
      console.log(req.body)
      db.collection('personSunctions')
        .find({ $text: { 
          $search: `"${req.body.lastName} ${req.body.firstName} ${req.body.patronymic || ''}"` } 
        })
        .toArray(function(err, result) {
          console.log(result)
          assert.strictEqual(null, err);
          res.status(200).json(result)
        });
    });

  app.post('/get-us-person-sanctions/', 
    ...midleware.validatePerson,
    (req, res) => {
      console.log(req.body)
      let initials = `${req.body.lastName} ${req.body.firstName}${req.body.patronymic ? (' ' + req.body.patronymic) : '' }`
      db.collection('usSanctionList')
      .find({ 
        $or: [
          {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            patronymic: req.body.patronymic
          },
          {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
          },
          { akaList: {$elemMatch: {initials: initials}} },
          { initials: initials }
      ]})
        .toArray(function(err, result) {
          console.log(result)
          assert.strictEqual(null, err);
          res.status(200).json(result)
        });
    });

  app.post('/get-eu-legal-sanctions/', 
    ...midleware.validateLegal,
    (req, res) => {
      console.log(req.body)
      db.collection('EUSanctionList')
        .find({ $text: { $search: `"${req.body.edrpou}"` }})
        .toArray(function(err, result) {
          console.log(result)
          assert.strictEqual(null, err);
          res.status(200).json(result)
        });
    });

  app.post('/get-eu-person-sanctions/', 
    ...midleware.validatePerson,
    (req, res) => {
      let initials = `${req.body.firstName}${req.body.patronymic ? (' ' + req.body.patronymic) : '' } ${req.body.lastName}`
      console.log(req.body)
      db.collection('EUSanctionList')
        .find({ $text: { 
          $search: `"${initials}"` } 
        })
        .toArray(function(err, result) {
          console.log(result)
          assert.strictEqual(null, err);
          res.status(200).json(result)
        });
    });

  app.post('/get-legal-sanctions/', 
    ...midleware.validateLegal,
    (req, res) => {
      console.log(req.body)
      db.collection('legalSunctions')
        .find({ $text: { $search: `"${req.body.edrpou}"` }})
        .toArray(function(err, result) {
          console.log(result)
          assert.strictEqual(null, err);
          res.status(200).json(result)
        });
    });

  app.post('/un-person-sanctions/', 
    ...midleware.validatePerson,
    (req, res) => {
      console.log(req.body)
      let initials = `${req.body.lastName} ${req.body.firstName}${req.body.patronymic ? (' ' + req.body.patronymic) : '' }`
      db.collection('blackListPersons')
        .find({ 
          $or: [
            {
              firstName: req.body.firstName,
              lastName: req.body.lastName,
              patronymic: req.body.patronymic
            },
            {
              firstName: req.body.firstName,
              lastName: req.body.lastName,
            },
            {
              INDIVIDUAL_ALIAS: { $elemMatch: {ALIAS_NAME: initials} }
            },
            { fullName: initials }
        ]})
        .toArray(function(err, result) {
          console.log(result)
          assert.strictEqual(null, err);
          res.status(200).json(result)
        });
    });

  app.post('/un-person-terror/', 
    ...midleware.validatePerson,
    (req, res) => {
      console.log(req.body)
      let initials = `${req.body.lastName} ${req.body.firstName}${req.body.patronymic ? (' ' + req.body.patronymic) : '' }`
      db.collection('terrorList')
        .find({ 
          $or: [
            {initials: initials},
            {alsoKnown: {$in: [initials]}}
          ],
        })
        .toArray(function(err, result) {
          console.log(result)
          assert.strictEqual(null, err);
          res.status(200).json(result)
        });
    });

  app.post('/get-legal-sanctions/', 
    ...midleware.validateLegal,
    (req, res) => {
      console.log(req.body)
      db.collection('legalSunctions')
        .find({ $text: { $search: `"${req.body.edrpou}"` } })
        .toArray(function(err, result) {
          console.log(result)
          assert.strictEqual(null, err);
          res.status(200).json(result)
        });
    });
}