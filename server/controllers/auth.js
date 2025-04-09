const axios = require("axios");
const { oauth2Client } = require("../utils/oauth2client");
const User = require("../models/user");
const { sendToken } = require("../utils/helper");

const googleAuth = async (req, res, next) => {
  const { code } = req.query;
  //   console.log(`Received code: ${code}`);
  if (!code) {
    return res.status(400).json({ error: "Authorization code is required" });
  }

  try {
    // Exchange the code for an access token
    const googleResponse = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(googleResponse.tokens);

    const userRes = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleResponse.tokens.access_token}`
    );

    const userData = userRes.data;
    const { email, name, picture } = userData;
    console.log("User data from Google:", userData);

    // Check if the user already exists in your database
    const existing_user = await User.findOne({ email });
    if (existing_user) {
      console.log("User already exists:", existing_user);
      return sendToken(res, existing_user, 200, "Logged in successfully");
    }

    // If the user doesn't exist, create a new user in your database
    const user = new User({
      name,
      email,
      avatar: picture,
    });

    await user.save();

    return sendToken(res, user, 200, "User created successfully");
  } catch (error) {
    console.log(error);
    console.error(
      "Error exchanging code for token:",
      error.response?.data || error.message
    );
    return res.status(500).json({ error: "Failed to exchange code for token" });
  }
};

const Logout = async (req, res) => {
  res
    .status(200)
    .cookie("video_chat_token", "", {
      maxAge: 0,
      sameSite: "none",
      httpOnly: true,
      secure: true,
    })
    .json({
      success: true,
      message: "Logged out successfully",
    });
};

module.exports = { googleAuth, Logout };
