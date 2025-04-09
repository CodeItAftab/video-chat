const express = require("express");
const { googleAuth, Logout } = require("../controllers/auth");

const router = express.Router();

router.get("/google", googleAuth);

router.get("/logout", Logout);

module.exports = router;
