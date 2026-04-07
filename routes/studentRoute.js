const express = require("express");

const router = express.Router();

const { studentLogin } = require("../controller/studentController.js");

router.post("/studentLog", studentLogin);

module.exports = router;
