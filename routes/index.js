var express = require('express');
var router = express.Router();
const fs = require("fs/promises");

/* GET home page. */
router.get('/apispec', async function(req, res, next) {
  try {
    res.json(JSON.parse(await fs.readFile('openapi/openapi.json',{encoding: 'utf-8'})))
  }
  catch (err) {
    res.status(500).send("OpenAPI definion malformed. Please notify server owner.");
  }
  
});

module.exports = router;
