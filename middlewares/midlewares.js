'use strict'

const { body, validationResult } = require('express-validator');


module.exports = {
  validateInitials: [
    [
      body('firstName').escape().not().isEmpty(),
      body('lastName').escape().not().isEmpty(),
      body('patronymic').escape().not().isEmpty(),
    ], 

    (req, res, next) => {

      checkErrors(req, res, next);
    }
  ],

  validatePerson: [
    [
      body('firstName').escape().not().isEmpty(),
      body('lastName').escape().not().isEmpty(),
      body('patronymic').escape(),
    ], 

    (req, res, next) => {

      checkErrors(req, res, next);
    }
  ],

  validateLegal: [
    [
      body('edrpou').escape().not().isEmpty(),
    ], 

    (req, res, next) => {

      checkErrors(req, res, next);
    }
  ],

  validateEdrpou: [
    [  
      body('edrpou')
        .isNumeric('uk-UA').withMessage('must contain only digits')
        .isLength({ min: 8, max: 8 }).withMessage('edrpou length should be 8')
        .escape()
    ], 

    (req, res, next) => {

      checkErrors(req, res, next);
    }, 
  ]
}


/* Helper function/s */

function checkErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  next();
}