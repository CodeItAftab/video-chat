const express = require("express");
const { isAuthenticated } = require("../middlewares/auth");
const { GetAllUsers } = require("../controllers/user");

const router = express.Router();

// Middleware to check authentication
router.use(isAuthenticated);

router.get("/all", GetAllUsers);

module.exports = router;
