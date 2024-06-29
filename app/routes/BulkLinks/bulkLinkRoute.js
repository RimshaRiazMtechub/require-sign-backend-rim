const express = require("express"),
  router = express.Router();

const controller = require("../../controllers/Bulk_Links/bulkLinkController");

router.post("/bulk_link", controller.addBulkLinks);

router.post("/addBulkLinksBgImgs", controller.addBulkLinksBgImgs);
router.post("/getbgImagesByBulkLinkId", controller.getbgImagesByBulkLinkId);
router.post("/get_bulk_link", controller.getAllBulkLinks);
router.post(
  "/getallPositionsFromBulkLinkId",
  controller.getallPositionsFromBulkLinkId
);
router.post(
  "/saveCanvasDataWithBulk_LinkId",
  controller.saveCanvasDataWithBulk_LinkId
);
router.post(
  "/checkEmailExistforSpecificResponse",
  controller.checkEmailExistforSpecificResponse
);

router.post("/saveBulkLinkResponse", controller.saveBulkLinkResponse);
router.post("/auditLogBulk", controller.auditLogBulk);

router.post("/viewBulkLink", controller.viewBulkLink);
router.post("/viewBulkLinkAuditLog", controller.viewBulkLinkAuditLog);

router.post(
  "/viewBulkLinkAuditLogSingle",
  controller.viewBulkLinkAuditLogSingle
);

router.post("/viewBulkLinkResponses", controller.viewBulkLinkResponses);

router.get("/viewActiveBulkLink", controller.viewActiveBulkLink);
router.post("/updateBulkLink", controller.updateBulkLink);
router.post("/updateStatus", controller.updateStatus);
router.post("/deleteBulkLinks", controller.deleteBulkLinks);

module.exports = router;
