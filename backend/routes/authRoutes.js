const express = require("express");
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");
const router = express.Router();

router.post("/user-register", authController.user_register);
router.post("/user-login", authController.user_login);
router.get("/get-users", authController.get_users);
router.get("/get-fyers-data",auth, authController.get_fyers_data);
router.delete("/delete-user/:id", auth, authController.delete_user);
module.exports = router;