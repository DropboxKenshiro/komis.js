const express = require("express");
const router = express.Router();
const passport = require("passport");
const mailjetLib = require("node-mailjet");
const {Op, where, QueryError} = require("sequelize");
const {locateAddress, geoCoordsDistance} = require("../utils/geo");
const {makeErrorJson} = require("../utils/misc");

const {sequelize, CarOffer, User, FollowedOffer} = require("../models/models");
const req = require("express/lib/request");

const mailjet = mailjetLib.connect(process.env.MAILJET_KEY, process.env.MAILJET_SECRET);

async function sendMail(targetUser, subject, content) {
  try {
    await mailjet.post('send', {version: 'v3.1'}).request({
      Messages: [
        {
          From: {
            Email: 'jatujestem144@gmail.com',
            Name: "komis.js"
          },
          To: [
            {
              Email: targetUser,
              Name: "You"
            }
          ],
          Subject: subject,
          TextPart: content
        }
      ]
    });
  }
  catch (err) {}
}

router.get('/fav', passport.authenticate('jwt', {session: false}), async function (req, res, next) {
  try {
    const followed = await FollowedOffer.findAll({
      include: {
        model: CarOffer,
        required: true
      },
      where: {
        UserEmail: req.user.email
      }
    });
    res.status(200).json(followed.map(x => x["CarOffer"]));
  }
  catch (err) {
    res.status(400).json(makeErrorJson(err));
  }
});

router.post('/fav/:offerid', passport.authenticate('jwt', {session: false}), async function (req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    await FollowedOffer.create({
      UserEmail: req.user.email,
      CarOfferOfferId: req.params.offerid
    }, {transaction: transaction});

    await transaction.commit();

    const favOfferData = await CarOffer.findByPk(req.params.offerid, {
      include: User
    });

    console.log(favOfferData);

    await sendMail(favOfferData.User.email,
      `Dear ${favOfferData.User.firstName}, someone followed your offer!`,
      `Dear ${favOfferData.User.firstName}, user ${req.user.email} followed your offer "${favOfferData.title}"`);

    res.status(200).json({
      success: true
    });
  }
  catch (err) {
    if (err instanceof QueryError) await transaction.rollback();
    res.status(400).json(makeErrorJson(err));
  }
});

router.delete('/fav/:offerid', passport.authenticate('jwt', {session: false}), async function (req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    await FollowedOffer.destroy({
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

function isIncluded(val) {
  return (val !== null && val !== undefined && val !== 'null');
}

router.get('/list', async function (req, res, next) {
  console.log(req.query);
  const whereObj = {price: {
    [Op.gte]: isIncluded(req.query.priceMin) ? req.query.priceMin : 0,
    [Op.lte]: isIncluded(req.query.priceMax) ? req.query.priceMax : Number.MAX_SAFE_INTEGER
  },
  modelYear: {
    [Op.gte]: isIncluded(req.query.yearMin) ? req.query.yearMin : 0,
    [Op.lte]: isIncluded(req.query.yearMax) ? req.query.yearMax : Number.MAX_SAFE_INTEGER
  },
  mileage: {
    [Op.gte]: isIncluded(req.query.mileageMin) ? req.query.mileageMin : 0,
    [Op.lte]: isIncluded(req.query.mileageMax) ? req.query.mileageMax : Number.MAX_SAFE_INTEGER
  }}

  if (isIncluded(req.query.user)) whereObj["UserEmail"] = req.query.user;

  const offerList = await CarOffer.findAll({
    where: whereObj
  });

  // eliminiate all offers that are farther than specified kilometer limit
  // this is kinda kinky to implement in sequelize, maybe we can change that in the future
  if (req.query.city && req.query.address) {
    const reqPos = await locateAddress(req.query.city, req.query.address);
    offerList = offerList.filter(o => (geoCoordsDistance(reqPos, [o.latitude, o.longitude]))/1000 <= req.query.kilometers);
  }

  res.status(200).json({
    success: true,
    list: offerList
  });
});

router.get('/:offerid', async function(req, res, next) {
  try {
    const offerInfo = await CarOffer.findByPk(req.params.offerid);

    if(offerInfo != null) {
      res.status(200).json({
        success: true,
        offerId: offerInfo.offerId,
        UserEmail: offerInfo.UserEmail,
        title: offerInfo.title,
        image: offerInfo.image,
        ManufactuerName: offerInfo.ManufactuerName,
        CarModelName: offerInfo.CarModelName,
        modelYear: offerInfo.modelYear,
        EngineTypeName: offerInfo.EngineTypeName,
        engineCapacity: offerInfo.engineCapacity,
        mileage: offerInfo.mileage,
        price: offerInfo.price,
        description: offerInfo.description,
        latiture: offerInfo.latitude,
        longitude: offerInfo.longitude,
        city: offerInfo.city,
        street: offerInfo.street,
        CountryName: offerInfo.CountryName
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
});

router.patch('/:offerid', passport.authenticate('jwt', {session: false}), async function(req, res, next) {
  try {
    const userCheckFetch = await CarOffer.findByPk(req.params.offerid);
    if(userCheckFetch.UserEmail !== req.user.email) {
      res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
  }
  catch (err) {
    res.status(400).json(makeErrorJson(err));
  }

  editQuery = {};
  if(isIncluded(req.body.image)) editQuery.image = req.body.image;
  if(isIncluded(req.body.price)) editQuery.price = req.body.price;
  if(isIncluded(req.body.modelYear)) editQuery.modelYear = req.body.modelYear;
  if(isIncluded(req.body.mileage)) editQuery.mileage = req.body.mileage;
  if(isIncluded(req.body.engineCapacity)) editQuery.engineCapacity = req.body.engineCapacity;
  if(isIncluded(req.body.description)) editQuery.description = req.body.description;
  if(isIncluded(req.body.ManufactuerName)) editQuery.ManufactuerName = req.body.ManufactuerName;
  if(isIncluded(req.body.EngineTypeName)) editQuery.EngineTypeName = req.body.EngineTypeName;
  if(isIncluded(req.body.city)) editQuery.city = req.body.city;
  if(isIncluded(req.body.street)) editQuery.street = req.body.street;
  if(isIncluded(req.body.CountryName)) editQuery.CountryName = req.body.CountryName;
  if(isIncluded(req.body.title)) editQuery.title = req.body.title;

  if(isIncluded(req.body.city) || isIncluded(req.body.street)) {
    const newLocation = locateAddress(req.body.city, req.body.street);
    editQuery.latitude = newLocation[0];
    editQuery.longitude = newLocation[1];
  }

  const transaction = await sequelize.transaction();
  try {
    await CarOffer.update(editQuery, {
      where: {
        offerId: req.params.offerid
      },
      transaction: transaction
    });
    transaction.commit();

    await sendMail(req.user.email,
      `Dear ${req.user.email}, your offer has been edited.`,
      `Dear ${req.user.email},  your offer has been succesfully edited. New data is visible to the users."`);

    res.status(200).json({
      success: true
    });
  }
  catch (err) {
    transaction.rollback();
    res.status(400).json(makeErrorJson(err));
  }
});

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
            EngineTypeName: req.body.EngineTypeName,
            CarModelName: req.body.carModel,
            price: req.body.price,
            modelYear: req.body.modelYear,
            mileage: req.body.mileage,
            engineCapacity: req.body.engineCapacity,
            description: req.body.description,
            city: req.body.city,
            street: req.body.street,
            CountryName: req.body.CountryName,
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