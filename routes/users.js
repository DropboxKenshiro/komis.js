var crypto = require("crypto");
var jsonwebtoken = require("jsonwebtoken");
var passport = require("passport")

var express = require('express');
var router = express.Router();
var {User} = require('../models/models');
var {issueToken} = require('../utils/auth');
var {makeErrorJson} = require('../utils/misc');

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
      phoneNumber: req.body.phoneNumber,
      zipCode: req.body.zipCode,
      location: req.body.location,
      description: req.body.description
    });
    res.status(200).json(
      {
        success: true
      }
    );
  }
  catch (err) {
    res.status(400).json(makeErrorJson(err));
  }
});

router.post('/login', passport.authenticate('local', {session: false}), function(req, res, next) {
  res.status(200).json({
    success: true,
    jwtToken: issueToken(req.body.email)
  });
});

router.get('/validate', passport.authenticate('jwt', {session: false}), function(req, res, next) {
  res.status(200).json({success: true});
});

router.get('/info/:uemail', async function(req, res, next) {
  const userInfo = await User.findByPk(req.params.uemail);

  if(userInfo != null) {
    res.status(200).json({
      success: true,
      email: userInfo.email,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      dateOfBirth: userInfo.dateOfBirth,
      adressString: userInfo.adressString,
      zipCode: userInfo.zipCode,
      phoneNumber: userInfo.phoneNumber,
      location: userInfo.location,
      phoneNumber: userInfo.phoneNumber
    });
  }
  else {
    res.status(400).json({
      success: false
    });
  }
});

router.patch('/edit/:uemail', passport.authenticate('jwt', {session: false}), async function(req, res, next) {
  // protection,  password should be changed by separate endpoint, salt should never be changed manually
  if("password" in req.body || "salt" in req.body) {
    res.status(403).json({
      success: false,
      message: "Illegal properties"
    });
    return;
  }
  // check if user changes its data
  if(req.params.uemail != req.user.email) {
    res.status(401).json({
      success: false,
      message: "Unauthorized"
    });
  }

  try {
    await User.update(req.body, {where: {
      email: req.params.uemail
    }});
  }
  catch (err) {
    res.status(400).json(makeErrorJson(err));
  }

  res.status(200).json({
    success: true
  });
});

module.exports = router;
