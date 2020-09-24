'use strict'

const { body, validationResult } = require('express-validator');

module.exports = {
  getDeclarations: [
    [
      body('firstName').escape().not().isEmpty(),
      body('lastName').escape().not().isEmpty(),
      body('patronymic').escape().not().isEmpty(),
    ], 

    (req, res, next) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      next();
    }
  ]
}
