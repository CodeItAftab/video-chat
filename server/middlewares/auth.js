const { TryCatch, ErrorHandler } = require("../utils/error");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const isAuthenticated = TryCatch(async (req, res, next) => {
  const token = req.cookies["video_chat_token"];
  if (!token) {
    return new ErrorHandler(401, `You need to login to access this route`);
  }
  // Verify the token and extract the user ID

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded._id);
  req.user = user;
  next();
});

module.exports = { isAuthenticated };
