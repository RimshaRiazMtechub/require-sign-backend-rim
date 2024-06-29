const express = require("express"),
router=express.Router();

const controller= require("../../controllers/Template/templateController");

router.post("/template",controller.addTemplates)


router.post("/addTemplatesBgImgs",controller.addTemplatesBgImgs)
router.post("/getbgImagesByTemplateId",controller.getbgImagesByTemplateId)
router.post("/get_template",controller.getAllTemplates)
router.post("/getallPositionsFromTemplateId",controller.getallPositionsFromTemplateId)
router.post("/saveCanvasDataWithtemplateId" , controller.saveCanvasDataWithtemplateId);
router.post("/saveTemplateResponse" , controller.saveTemplateResponse);

router.post("/checkEmailExistforSpecificResponse" , controller.checkEmailExistforSpecificResponse);

router.post("/generate_pdf" , controller.generate_pdf);

router.post("/shareTemplates" , controller.shareTemplates);
router.post("/unHashTemplates" , controller.unHashTemplates);
router.post("/downloaded_template_shared" , controller.downloaded_template_shared);




router.post("/viewTemplate",controller.viewTemplate)
router.post("/viewTemplateAuditLog",controller.viewTemplateAuditLog)

router.post("/viewTemplateAuditLogSingle",controller.viewTemplateAuditLogSingle)



router.post("/viewTemplateResponses",controller.viewTemplateResponses)

router.get("/viewActiveTemplate",controller.viewActiveTemplate)
router.post("/updateTemplate",controller.updateTemplate)
router.post("/updateStatus",controller.updateStatus)
router.post("/deleteTemplates",controller.deleteTemplates)



module.exports=router