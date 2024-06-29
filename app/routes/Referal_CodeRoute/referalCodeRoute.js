const express = require('express');
const multer = require("multer");
const controller = require("../../controllers/Referal_Code/referalCodeController")
const router = express.Router();
// Multer configuration for handling image uploads
router.post("/add_referal_code", controller.registerReferal_code);
router.post("/update_code" , controller.updateReferal);
router.post("/delete", controller.deleteReferalCode);
router.get("/get_all_referal_code", controller.getAllReferal_codes);
router.post("/getReferalById", controller.getReferal_codeById);
router.post("/change_status", controller.changeStatus);
router.post("/update_status", controller.updateStatus);

module.exports = router;