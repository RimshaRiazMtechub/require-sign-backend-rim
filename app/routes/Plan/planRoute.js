const express = require('express');
const router = express.Router();
const controller = require("../../controllers/Plan/planController")

router.post("/create-Plan" , controller.createPlan);
router.put("/rename_Plan"  ,  controller.updateProfile);
router.delete("/delete_Plan",controller.deletePlans)
router.post("/get_all_user_plans",controller.getAllPlans)
router.post("/get_user_plan",controller.getUserPlan)
router.post("/get_user_plan_data",controller.getUserPlanData)

router.post("/change_status",controller.updateStatus)

module.exports = router;