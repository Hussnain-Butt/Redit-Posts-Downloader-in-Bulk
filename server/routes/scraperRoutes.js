const express = require("express");
const { scrapeSubreddit } = require("../controllers/scraperController");
const router = express.Router();

router.post("/scrape", scrapeSubreddit);

module.exports = router;
