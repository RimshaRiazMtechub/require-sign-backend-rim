const express = require("express");
const multer = require("multer");

const controller = require("../../controllers/Company/companyController");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Use forward slashes (/) instead of backslashes (\)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });
const router = express.Router();
router.post("/register", controller.registerCompany);
router.post("/login", controller.login);
router.post("/add_company_admin", controller.add_company_admin);
router.post("/add_company_user", controller.add_company_user);
router.post("/add_company_user1", controller.add_company_user1);

router.post("/activateAccount", controller.activateAccount);
router.post("/resendRegistrationLink", controller.resendRegistrationLink);

router.post("/get_company_users", controller.getCompanyUsers);

router.post("/get_company_users_by_id", controller.getCompanyUsersById);

router.post("/company_user_login", controller.getCompanyUserLogin);
// for other
router.post("/get_company", controller.getCompany);

router.put("/update_status", controller.updateStatus);
router.post("/update_multiple_status", controller.updateMultipleStatus);

router.post("/update_company", controller.updateProfile);
router.put("/update_company_subdomain", controller.updateCompanySubdomain);

router.put("/updatePassword", controller.passwordUpdate);
router.get("/get_all_companies", controller.getAllCompanys);
router.post("/create_password_company", controller.create_password_company);

router.post("/getCompanyById", controller.getCompanyById);
router.post("/forget-password", controller.forgetPassword);
router.post("/account-verification", controller.emailverification);
router.post("/deleteCompany", controller.deleteCompany);
module.exports = router;
