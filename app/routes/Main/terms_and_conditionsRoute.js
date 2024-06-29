const express = require("express"),
router=express.Router();

const controller= require("../../controllers/Main/terms_and_conditions");

router.post("/add",controller.addTermsAndConditions)
router.get("/getAllTermsAndConditions",controller.getAllTermsAndConditions)
router.get("/viewTermsAndCondition",controller.viewTermsAndCondition)
router.get("/viewActiveTermsAndCondition",controller.viewActiveTermsAndCondition)
router.put("/updateTermsAndCondition",controller.updateTermsAndCondition)
router.put("/updateStatus",controller.updateStatus)



module.exports=router