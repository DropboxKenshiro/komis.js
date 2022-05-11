const express = require("express");
const router = express.Router();
const {makeErrorJson} = require('../utils/misc');
const {Country, EngineType} = require('../models/models');

router.get("/countries", async function (req, res, next) {
    try {
        const rawResults = await Country.findAll({
            attributes: ["name"]
        });
        res.status(200).json(rawResults.map(x => x["name"]));
    }
    catch (e) {
        res.status(400).json(makeErrorJson(e));
    }
});

router.get("/engines", async function (req, res, next) {
    try {
        const rawResults = await EngineType.findAll({
            attributes: ["name"]
        });
        res.status(200).json(rawResults.map(x => x["name"]));
    }
    catch (e) {
        res.status(400).json(makeErrorJson(e));
    }
});

module.exports = router;