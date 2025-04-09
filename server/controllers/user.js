const User = require("../models/user");
const { TryCatch } = require("../utils/error");

const GetAllUsers = TryCatch(async (req, res, next) => {
  // find all users other tha myself
  const users = await User.find({ _id: { $ne: req.user._id } });
  return res.status(200).json({
    success: true,
    users,
    message: "All users fetched successfully",
  });
});

module.exports = { GetAllUsers };
