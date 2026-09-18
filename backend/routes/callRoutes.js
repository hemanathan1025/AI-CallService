const express = require("express");

const {
  handleIncomingCall,
} = require("../controllers/callController");

const router = express.Router();

router.post("/", handleIncomingCall);
router.post("/incoming", handleIncomingCall);

module.exports = router;
