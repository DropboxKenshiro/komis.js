const express = require("express");
const router = express.Router();
const passport = require("passport");

const {CarOffer} = require("../models/models");

router.post('/', passport.authenticate('jwt', {session: false}), function(req, res, next) {
    try {
        await CarOffer.create({
            image: req.body.image,
            price: req.body.price,
            modelYear: req.body.modelYear,
            mileage: req.body.mileage,
            engineCapacity: req.body.engineCapacity,
            description: req.body.description,
            latitude: 0,
            longitude: 0 // geographical coordinates would be determined from location given in body
        });
        res.status(200).json({
            success: true
        })
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
})