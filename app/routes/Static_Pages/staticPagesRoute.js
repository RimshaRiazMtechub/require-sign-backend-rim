const express = require('express');
const router = express.Router();
const controller = require("../../controllers/Static_Pages/staticPagesController")

router.post("/create" , controller.createPage);
router.post("/get-single"  ,  controller.getSinglePage);
router.delete("/delete_req",controller.deletereqs)
router.get("/get_all",controller.getAllPages)
router.post("/update",controller.updatePages)

module.exports = router;