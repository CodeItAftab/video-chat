const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};

const sendToken = (res, user, statusCode, message) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  return res
    .status(statusCode)
    .cookie("video_chat_token", token, cookieOptions)
    .json({
      success: true,
      message,
      user,
    });
};

module.exports = { sendToken };
