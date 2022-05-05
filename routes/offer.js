const express = require("express");
const router = express.Router();
const passport = require("passport");
const {Op} = require("sequelize");
const {locateAddress, geoCoordsDistance} = require("../utils/geo");

const {CarOffer, User, FollowedOffer} = require("../models/models");

router.get('/fav', passport.authenticate('jwt', {session: false}), async function (req, res, next) {
  try {
    const followed = await CarOffer.findAll({
      include: {
        model: User,
        as: 'favouriteOffer',
        required: true,
        attributes: []
      }
    });
    res.status(200).json(followed);
  }
  catch (err) {
    res.status(400).json({
      success: false,
      errorType: err.name,
      errorDescription: err.message
    })
  }
})

router.post('/fav/:offerid', passport.authenticate('jwt', {session: false}), function (req, res, next) {
  try {
    FollowedOffer.create({
      UserEmail: req.user.email,
      CarOfferOfferId: req.params.offerid
    });

    res.status(200).json({
      success: true
    })
  }
  catch (err) {
    res.status(400).json({
      success: false,
      errorType: err.name,
      errorDescription: err.message
    })
  }
});

router.delete('/fav/:offerid', passport.authenticate('jwt', {session: false}), function (req, res, next) {
  try {
    FollowedOffer.delete({
      where: {
        UserEmail: req.user.email,
        CarOfferOfferId: req.params.offerid
      }
    });

    res.status(200).json({
      success: true
    })
  }
  catch (err) {
    res.status(400).json({
      success: false,
      errorType: err.name,
      errorDescription: err.message
    })
  }
})

router.get('/list', async function (req, res, next) {
  const offerList = await CarOffer.findAll({
    where: {
      price: {
        [Op.gte]: req.body.priceMin ? req.body.priceMin : 0,
        [Op.lte]: req.body.priceMax ? req.body.priceMax : Number.MAX_SAFE_INTEGER
      },
      modelYear: {
        [Op.gte]: req.body.yearMin ? req.body.yearMin : 0,
        [Op.lte]: req.body.yearMax ? req.body.yearMax : Number.MAX_SAFE_INTEGER
      },
      mileage: {
        [Op.gte]: req.body.mileageMin ? req.body.mileageMin : 0,
        [Op.lte]: req.body.mileageMax ? req.body.mileageMax : Number.MAX_SAFE_INTEGER
      }
    }
  })

  // eliminiate all offers that are farther than specified kilometer limit
  // this is kinda kinky to implement in sequelize, maybe we can change that in the future
  const reqPos = await locateAddress(req.body.city, req.body.address);
  const offerListFiltered = offerList.filter(o => (geoCoordsDistance(reqPos, [o.latitude, o.longitude]))/1000 <= req.body.kilometers);

  res.status(200).json({
    success: true,
    list: offerListFiltered
  });
})

router.get('/:offerid', async function(req, res, next) {
  try {
    const offerInfo = await CarOffer.findByPk(req.params.offerid);

    if(offerInfo != null) {
      res.status(200).json({
        success: true,
        offerId: offerInfo.offerId,
        userEmail: offerInfo.UserEmail,
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
      res.status(404).json({
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

router.delete('/:offerid', passport.authenticate('jwt', {session: false}), async function(req, res, next) {
  try {
    const numDeleted = await CarOffer.destroy({
      where: {
        offerId: req.params.offerid,
        UserEmail: req.user.email
      }
    })

    if(numDeleted === 0) {
      res.status(404).json({
        success: false
      })
    }
    else {
      res.status(200).json({success: true})
    }
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

router.post('/', passport.authenticate('jwt', {session: false}), async function(req, res, next) {
    try {
        const addressLocation = await locateAddress(req.body.city, req.body.address)

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
            latitude: addressLocation[0],
            longitude: addressLocation[1]
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