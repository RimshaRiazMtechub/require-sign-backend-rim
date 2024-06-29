const express = require("express"),
router=express.Router();

const controller= require("../../controllers/Main/about_us");

router.post("/add",controller.add_aboutus)
router.get("/getAlladd_aboutus",controller.getAlladd_aboutus)
router.get("/viewAboutUs",controller.viewAboutUs)
router.get("/viewActiveAboutUs",controller.viewActiveAboutUs)
router.put("/updateAboutUs",controller.updateAboutUs)
router.put("/updateStatus",controller.updateStatus)


module.exports=router