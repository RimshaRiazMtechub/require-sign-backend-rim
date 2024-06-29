const express = require('express');
const multer = require("multer");



const controller = require("../../controllers/Company/companyController")
const path = require('path')

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
router.post("/register", upload.single("image"), controller.registerCompany);
router.post("/login", controller.login);
router.post("/add_company_admin", controller.add_company_admin);
router.post("/get_company_users", controller.getCompanyUsers);
router.post("/get_company_users_by_id", controller.getCompanyUsersById);


router.put("/update_status", controller.updateStatus);
router.put("/update_multiple_status", controller.updateMultipleStatus);


router.put("/update_company", upload.single("image"), controller.updateProfile);

router.put("/updatePassword", controller.passwordUpdate);
router.get("/get_all_companies", controller.getAllCompanys);


router.post("/getCompanyById", controller.getCompanyById);
router.post("/forget-password", controller.forgetPassword);
router.post("/account-verification", controller.emailverification);



module.exports = router;