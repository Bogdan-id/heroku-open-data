'use strict'

const url = require('url').URL;
const fetch = require('node-fetch');
const assert = require('assert');
const midleware = require('../middlewares/midlewares.js');

module.exports = function(app, db) {
  app.post('/get-declarations', 
    ...midleware.validateInitials,
    (req, res) => {  
      
      // const domain = 'https://declarations.com.ua/'
      // const options = 'doc_type%5B%5D=Щорічна&format=opendata&sort=year_desc'

      const { lastName, firstName, patronymic } = req.body
      const uri = `https://declarations.com.ua/search?q=${lastName}+${firstName}+${patronymic}&deepsearch=on&doc_type[]=Щорічна&doc_type[]=Перед+звільненням&doc_type[]=Кандидата+на+посаду&doc_type[]=Після+звільнення&doc_type[]=Форма+змін&post_type[]=державної&post_type[]=місцевого&post_type[]=юридичної&format=opendata`

      let declarUrl = new url(uri)

      fetch(declarUrl)
        .then(response => response.json())
        .then(val => res.send(val))
        .catch(err => res.send(err))
    }
  ),

  app.post('/get-edr-persons',
    ...midleware.validateInitials,
    (req, res) => {
      // console.log(req.body)
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
          // console.log(result)
          assert.strictEqual(null, err);
          res.status(200).send(result)
        });
  }),

  app.post('/get-edr-legals',
    ...midleware.validateLegal,
    (req, res) => {
      console.log(req.body)
      db.collection('edr')
        .find({edrpou: req.body.edrpou})
        .toArray(function(err, result) {
          // console.log(result)
          assert.strictEqual(null, err);
          res.status(200).send(result);
        });
    }),

  app.post('/get-public-person',
    ...midleware.validateInitials,
    (req, res) => {
      // console.log(req.body)
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
          // console.log(result)
          assert.strictEqual(null, err);
          res.status(200).send(result);
        });
  }),

  
  app.post('/get-related-persons/', 
    ...midleware.validateEdrpou,
    (req, res) => {
      // console.log(req.body)
      db.collection('pepPersons')
        .find({
          is_pep: true,
          related_companies: { $elemMatch: {to_company_edrpou: req.body.edrpou} },
        })
        .toArray(function(err, result) {
          // console.log(result)
          assert.strictEqual(null, err);
          res.status(200).json(result)
        });
  });

  app.post('/get-person-sanctions/', 
    ...midleware.validatePerson,
    (req, res) => {
      // console.log(req.body)
      db.collection('personSunctions')
        .find({ 
          $text: { 
            $search: `"${req.body.lastName} ${req.body.firstName} ${req.body.patronymic || ''}"`,
            $caseSensitive: false
          } 
        })
        .toArray(function(err, result) {
          // console.log(result)
          assert.strictEqual(null, err);
          res.status(200).json(result)
        });
    });

  app.post('/get-eu-legal-sanctions/', 
    // ...midleware.validateLegal,
    (req, res) => {
      // console.log(req.body)
      db.collection('EUSanctionList')
        .find({ 
          $text: { $search: `"${req.body.edrpou}"` }
         })
         .toArray(function(err, result) {
          if(!result.length) {
            db.collection('EUSanctionList')
              .find({
                $text: { $search: `"${req.body.companyName}"`}
              })
              .toArray(function(err, result) {
                assert.strictEqual(null, err);
                res.status(200).json(result)
              })
          } else {
            // console.log(result)
            assert.strictEqual(null, err);
            res.status(200).json(result)
          }
        });
    });




    app.post('/un-legal-sanctions/', 
    // ...midleware.validateLegal,
    (req, res) => {
      // console.log(req.body)
      db.collection('UNOsancLegal')
        .find({ 
          $or: [
            {firstName: req.body.companyName},
            {ENTITY_ALIAS: { $elemMatch: {ALIAS_NAME: req.body.companyName} }}
          ]
        })
        .toArray(function(err, result) {
          // console.log(result)
          assert.strictEqual(null, err);
          res.status(200).json(result)
        });
    });

    app.post('/un-legal-terrors/', 
    // ...midleware.validateLegal,
    (req, res) => {
      // console.log(req.body)
      if(!req.body.companyName) {
        res.status(200).json([]) 
        return
      }
      db.collection('UNOsancTerror')
        .find({
          $and: [
            {
              $or: [
                {initials: req.body.companyName},
                {alsoKnown: {$in: [req.body.companyName]}}
              ]
            },
            {"type-entry": "1"}
          ]
        })
        .toArray(function(err, result) {
          // console.log(result)
          assert.strictEqual(null, err);
          res.status(200).json(result)
        });
    });

    app.post('/un-person-terror/', 
    ...midleware.validatePerson,
    (req, res) => {
      // console.log(req.body)
      let initials = `${req.body.lastName} ${req.body.firstName}${req.body.patronymic ? (' ' + req.body.patronymic) : '' }`
      console.log(initials)
      db.collection('UNOsancTerror')
        .find({ 
          $or: [
            {fullName: initials},
            {alsoKnown: {$in: [initials]}}
          ],
        })
        .toArray(function(err, result) {
          // console.log(result)
          assert.strictEqual(null, err);
          res.status(200).json(result)
        });
    });

    app.post('/us-legal-sanctions/', 
      // ...midleware.validateLegal,
      (req, res) => {
        // console.log(req.body)
        db.collection('USAsanc')
          .find({
            $and: [
              { sdnType: "ENTITY" },
              { $or: [
                { lastName: req.body.companyName },
                { akaList: {$elemMatch: { fullName: req.body.companyName }} }
              ]}
            ]
          })
          .toArray(function(err, result) {
            // console.log(result)
            assert.strictEqual(null, err);
            res.status(200).json(result)
          });
      });

    app.post('/us-person-sanctions/', 
      ...midleware.validatePerson,
      (req, res) => {
        // console.log(req.body)
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
          ]
        }).toArray(function(err, result) {
            // console.log(result)
            assert.strictEqual(null, err);
            res.status(200).json(result)
          });
      });


  app.post('/get-eu-person-sanctions/', 
    ...midleware.validatePerson,
    (req, res) => {
      let initials = `${req.body.firstName}${req.body.patronymic ? (' ' + req.body.patronymic) : '' } ${req.body.lastName}`
      // console.log(req.body)
      db.collection('EUSanctionList')
        .find({ $text: { 
          $search: `"${initials}"` } 
        })
        .toArray(function(err, result) {
          // console.log(result)
          assert.strictEqual(null, err);
          res.status(200).json(result)
        });
    });

  app.post('/get-legal-sanctions/', 
    // ...midleware.validateLegal,
    (req, res) => {
      // console.log(req.body)
      db.collection('legalSunctions')
        .find({ 
          $text: { $search: `"${req.body.edrpou}"` },
        })
        .toArray(function(err, result) {
          if(!result.length) {
            db.collection('legalSunctions')
              .find({
                $text: { $search: `"${req.body.companyName}"`}
              })
              .toArray(function(err, result) {
                assert.strictEqual(null, err);
                res.status(200).json(result)
              })
          } else {
            // console.log(result)
            assert.strictEqual(null, err);
            res.status(200).json(result)
          }
        });
    });

  app.post('/un-person-sanctions/', 
    ...midleware.validatePerson,
    (req, res) => {
      // console.log(req.body)
      let initials = `${req.body.lastName} ${req.body.firstName}${req.body.patronymic ? (' ' + req.body.patronymic) : '' }`
      db.collection('UNOsancPerson')
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
          // console.log(result)
          assert.strictEqual(null, err);
          res.status(200).json(result)
        });
    });
}