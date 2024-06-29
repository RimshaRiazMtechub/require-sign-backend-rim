const express = require('express');
const router = express.Router();
const controller = require("../../controllers/TransactionHistory/TransactionHistoryController")

router.post("/createReq" , controller.createreq);
router.put("/rename_req"  ,  controller.updateProfile);
router.delete("/delete_req",controller.deletereqs)
router.get("/get_all_transactions",controller.getAllreqs)
router.post("/change_status",controller.updateStatus)

module.exports = router;