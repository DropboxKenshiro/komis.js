var crypto = require("crypto");

var express = require('express');
var router = express.Router();
var {User} = require('../models/models');

router.post('/register', async function(req, res, next) {
  try {
    const hasher = crypto.createHash('sha256');
    const saltUUID = crypto.randomUUID();
    hasher.update(req.body.password + saltUUID);

    await User.create({
      email: req.body.email,
      password: hasher.digest('hex'),
      salt: saltUUID,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      dateOfBirth: req.body.dateOfBirth,
      adressString: req.body.adressString,
      zipCode: req.body.zipCode,
      location: req.body.location,
      description: req.body.description
    });
    res.status(200).json(
      {
        success: true
      }
    )
  }
  catch (err) {
    res.status(400).json(
      {
        success: false,
        errorType: err.name,
        errorDescription: err.message
      }
    )
  }
});

router.get('/info', function(req, res, next) {

})

module.exports = router;
