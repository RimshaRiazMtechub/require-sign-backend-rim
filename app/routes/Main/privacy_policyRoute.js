const express = require("express"),
router=express.Router();

const controller= require("../../controllers/Main/privacy_policy");

router.post("/add",controller.addPrivacyPolicy)
router.get("/getAllPrivacyPlicies",controller.getAllPrivacyPlicies)
router.get("/viewPrivacyPolicy",controller.viewPrivacyPolicy)
router.get("/viewActivePrivacyPolicy",controller.viewActivePrivacyPolicy)
router.put("/updatePrivacyPolicy",controller.updatePrivacyPolicy)
router.put("/updateStatus",controller.updateStatus)


module.exports=router