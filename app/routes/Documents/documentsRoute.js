const express = require('express');
const router = express.Router();
const controller = require("../../controllers/Documents/documentsController")

router.post("/addDocuments" , controller.registerDocuments);
// router.post("/login" , controller.login);
// router.put("/update_profile"  ,  controller.updateProfile);
// router.put("/updatePassword", controller.passwordUpdate);
// router.get("/getAllUsers", controller.getAllDocumentss);
// router.post("/getUserById", controller.getDocumentsById);
// router.post("/forget-password", controller.forgetPassword);
// router.post("/account-verification", controller.emailverification);
// router.put("/customLogo",controller.customLogo)
// router.put("/customSignature",controller.customSignatures)
// router.put("/customSignaturesDelete",controller.customSignaturesDelete)
// router.put("/customInitialsDelete",controller.customInitialsDelete)




module.exports = router;