const express = require("express");

const router = express.Router();

router.get("/callback", (req, res) => {
  const { code } = req.query;
  console.log(`Received code: ${code}`);
  if (!code) {
    return res.status(400).json({ error: "Authorization code is required" });
  }

  // Here you would typically exchange the code for an access token
  res.json({
    message: "Google authentication successful",
    code,
  });
});

module.exports = router;
