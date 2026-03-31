const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const { getProfile, updateProfile, sendEmailOTP } = require("../controllers/user.controller");

router.get("/profile", auth, getProfile);
router.post("/send-otp", auth, sendEmailOTP);
router.put("/profile", auth, updateProfile);

module.exports = router;
