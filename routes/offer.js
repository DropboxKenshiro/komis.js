const express = require("express");
const router = express.Router();
const passport = require("passport");
const {Client} = require("@googlemaps/google-maps-services-js");

const {CarOffer} = require("../models/models");

router.get('/:offerid', async function(req, res, next) {
  try {
    const offerInfo = await CarOffer.findByPk(req.params.offerid);

    if(offerInfo != null) {
      res.status(200).json({
        success: true,
        offerId: offerInfo.offerId,
        title: offerInfo.title,
        manufactuer: offerInfo.ManufactuerName,
        carModel: offerInfo.CarModelName,
        modelYear: offerInfo.modelYear,
        engineType: offerInfo.EngineTypeName,
        engineCapacity: offerInfo.engineCapacity,
        mileage: offerInfo.mileage,
        description: offerInfo.description,
        latitude: offerInfo.latitude,
        longitude: offerInfo.longitude
      })
    }
    else {
      res.status(400).json({
        success: false,
        message: "No offer with that id exists"
      })
    }
  }
  catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    })
  }
  
})

router.post('/', passport.authenticate('jwt', {session: false}), async function(req, res, next) {
    try {
        const client = new Client({});
        const options = {
          params: {
            key: process.env.MAPS_API_KEY,
            address: `${req.body.adress}, ${req.body.city}`
          }
        }
        const geodata = await client.geocode(options);

        await CarOffer.create({
            UserEmail: req.user.email,
            title: req.body.title,
            image: req.body.image,
            ManufactuerName: req.body.manufactuer,
            EngineTypeName: req.body.engineType,
            CarModelName: req.body.carModel,
            price: req.body.price,
            modelYear: req.body.modelYear,
            mileage: req.body.mileage,
            engineCapacity: req.body.engineCapacity,
            description: req.body.description,
            latitude: geodata.data.results[0].geometry.location.lat,
            longitude: geodata.data.results[0].geometry.location.lng // geographical coordinates would be determined from location given in body
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

module.exports = router;