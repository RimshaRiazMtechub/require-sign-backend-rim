const express = require('express');
const multer = require("multer");
const controller = require("../../controllers/Admin/adminController")

const path =require('path')
// Set up multer for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Use forward slashes (/) instead of backslashes (\)
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
  const upload = multer({ storage });

const router = express.Router();
// Multer configuration for handling image uploads
router.post("/register" ,upload.single("image"), controller.registerCustomer);
router.post("/login" , controller.login);
router.post("/update_profile"  ,controller.updateProfile);
router.post("/updatePassword", controller.passwordUpdate);
router.post("/updatePasswordByToken", controller.passwordUpdateToken);
router.put("/passwordUpdateProf", controller.passwordUpdateProf);

router.get("/get-all", controller.getAllCustomers);
router.post("/getUserById", controller.getCustomerById);
router.post("/forget-password", controller.forgetPassword);
router.post("/checkTokenValidUpdatePassword", controller.checkTokenValidUpdatePassword);
router.post("/resentEmailtoverify", controller.resentLinkForgetPassword);

router.post("/email-reset-link", controller.emailResetLink);
router.post("/email_update", controller.EmailUpdate);
router.post("/account-verification", controller.emailverification);
router.post("/change-status", controller.changeStatus);
router.delete("/delete-admin", controller.deleteAdmin);
router.post("/invite-admin",upload.single("image"), controller.InviteAdmin);





module.exports = router;