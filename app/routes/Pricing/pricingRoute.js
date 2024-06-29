const express = require('express');
const router = express.Router();
const controller = require("../../controllers/Pricing/pricingController")

router.post("/create-Plan" , controller.createPlan);
// router.put("/rename_Plan"  ,  controller.updateProfile);
// router.delete("/delete_Plan",controller.deletePlans)
router.get("/get_all_pricing",controller.getAllPlans)
router.post("/get_plan_by_type",controller.getPlanByType)
router.post("/get_user_plan",controller.getUserPlan)

// router.post("/change_status",controller.updateStatus)

module.exports = router;