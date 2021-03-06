'use strict'

const url = require('url').URL;
const fetch = require('node-fetch');
const assert = require('assert');
const midleware = require('../middlewares/midlewares.js');
const helper = require('../utils/helpers')

module.exports = function(app, db) {
  app.post('/get-declarations', 
    ...midleware.validateInitials,
    (req, res) => {  
      
      // const domain = 'https://declarations.com.ua/'
      // const options = 'doc_type%5B%5D=Щорічна&format=opendata&sort=year_desc'

      const { lastName, firstName, patronymic } = req.body
      const uri = `https://declarations.com.ua/search?q=${lastName}+${firstName}+${patronymic}&format=opendata&sort=year_desc` // &deepsearch=on

      let declarUrl = new url(uri)

      fetch(declarUrl)
        .then(response => response.json())
        .then(val => res.send(val))
        .catch(err => res.send(err))
    }
  ),

  app.get('/get-nbu-mfo', 
    (req, res) => {  
      const uri = `https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0&json`

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

  app.post('/get-edr-initial',
    ...midleware.validateInitials,
    (req, res) => {
      let initials = `${req.body.lastName} ${req.body.firstName} ${req.body.patronymic || ''}`
      console.log(req.body)
      console.log(initials)
      // Бабенко Тетяна Олександрівна
      db.collection('EDRpersons')
        .find({
          initials: `${initials}`,
        })
        .toArray(function(err, result) {
          console.log(result)
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
      function queryObj(obj) {
        return { 
          text: {
            $regex: new RegExp(`(?:^|\\s)${obj.qp}(?=\\s|$)`, 'gi'),
          },
        } 
      }

      helper.getPerson(db, 'personSunctions', req, res, queryObj)
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
      console.log(req.body.companyName)
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
      function queryObj(obj) {
        return {
          $or: [
            {fullName: {$regex: new RegExp(`(?:^|\\s)${obj.qp}(?=\\s|$)`, 'g')}},
            {alsoKnown: {$in: [new RegExp(`(?:^|\\s)${obj.qp}(?=\\s|$)`, 'g')]}},
          ],
        }
      }
      helper.getPerson(db, 'UNOsancTerror', req, res, queryObj)
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
        function queryObj(obj) {
          return {
            $or: [
              { 
                initials: {$regex: new RegExp(`(?:^|\\s)${obj.qp}(?=\\s|$)`, 'g')},
                sdnType: 'INDIVIDUAL'
              },
              { 
                akaList: {$elemMatch: {initials: {$regex: new RegExp(`(?:^|\\s)${obj.qp}(?=\\s|$)`, 'g')} } },
                sdnType: 'INDIVIDUAL'
              }
            ]
          }
        }
        helper.getPerson(db, 'usSanctionList', req, res, queryObj)
      });


  app.post('/get-eu-person-sanctions/', 
    ...midleware.validatePerson,
    (req, res) => {
      function queryObj(obj) {
        return { 
          text: {
            $regex: new RegExp(`(?:^|\\s)${obj.qp}(?=\\s|$)`, 'gi'),
          },
        } 
      }

      helper.getPerson(db, 'EUSanctionList', req, res, queryObj)
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
      function queryObj(obj) {
        return {
          $or: [
            { fullName: {$regex: new RegExp(`(?:^|\\s)${obj.qp}(?=\\s|$)`, 'g')}, },
            { INDIVIDUAL_ALIAS: {$elemMatch: {ALIAS_NAME: {$regex: new RegExp(`(?:^|\\s)${obj.qp}(?=\\s|$)`, 'g')} } } }
          ]
        }
      }
      helper.getPerson(db, 'UNOsancPerson', req, res, queryObj)
    });
}