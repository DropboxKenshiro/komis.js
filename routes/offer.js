const express = require("express");
const router = express.Router();
const passport = require("passport");
const {Op} = require("sequelize");
const {locateAddress, geoCoordsDistance} = require("../utils/geo");
const {makeErrorJson} = require("../utils/misc");

const {sequelize, CarOffer, User, FollowedOffer} = require("../models/models");

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
    res.status(400).json(makeErrorJson(err));
  }
});

router.post('/fav/:offerid', passport.authenticate('jwt', {session: false}), async function (req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    FollowedOffer.create({
      UserEmail: req.user.email,
      CarOfferOfferId: req.params.offerid
    }, {transaction: transaction});

    await transaction.commit();
    res.status(200).json({
      success: true
    });
  }
  catch (err) {
    await transaction.rollback();
    res.status(400).json(makeErrorJson(err));
  }
});

router.delete('/fav/:offerid', passport.authenticate('jwt', {session: false}), async function (req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    await FollowedOffer.delete({
      where: {
        UserEmail: req.user.email,
        CarOfferOfferId: req.params.offerid
      }
    }, {transaction: transaction});

    await transaction.commit();
    res.status(200).json({
      success: true
    });
  }
  catch (err) {
    await transaction.rollback();
    res.status(400).json(makeErrorJson(err));
  }
});

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
      },
      UserEmail: req.body.user
    }
  });

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
        id: offerInfo.offerId,
        userEmail: offerInfo.UserEmail,
        title: offerInfo.title,
        image: offerInfo.image,
        manufactuer: offerInfo.ManufactuerName,
        carModel: offerInfo.CarModelName,
        year: offerInfo.modelYear,
        engineType: offerInfo.EngineTypeName,
        engineCapacity: offerInfo.engineCapacity,
        mileage: offerInfo.mileage,
        price: offerInfo.price,
        description: offerInfo.description,
        lat: offerInfo.latitude,
        lng: offerInfo.longitude
      });
    }
    else {
      res.status(404).json({
        success: false,
        message: "No offer with that id exists"
      });
    }
  }
  catch (err) {
    res.status(400).json(makeErrorJson(err));
  }
  
})

router.delete('/:offerid', passport.authenticate('jwt', {session: false}), async function(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const numDeleted = await CarOffer.destroy({
      where: {
        offerId: req.params.offerid,
        UserEmail: req.user.email
      }
    });
    await transaction.commit();

    if(numDeleted === 0) {
      res.status(404).json({
        success: false
      });
    }
    else {
      res.status(200).json({success: true});
    }
  }
  catch (err) {
    await transaction.rollback();
    res.status(400).json(makeErrorJson(err));
  }
});

router.post('/', passport.authenticate('jwt', {session: false}), async function(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
        const addressLocation = await locateAddress(req.body.city, req.body.address);

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
        await transaction.commit();
        res.status(200).json({
            success: true
        });
    }
    catch (err) {
        await transaction.rollback();
        res.status(400).json(makeErrorJson(err));
      }
});

module.exports = router;