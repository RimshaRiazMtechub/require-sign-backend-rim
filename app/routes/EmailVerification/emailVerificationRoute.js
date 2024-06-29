const express = require('express');
const router = express.Router();
const controller = require("../../controllers/EmailVerification/emailVerificationController")

router.post("/create" , controller.createPage);
router.post("/get"  ,  controller.getSinglePage);
router.delete("/delete",controller.deletereqs)
router.get("/get_all",controller.getAllPages)
router.post("/update",controller.updatePages)

module.exports = router;