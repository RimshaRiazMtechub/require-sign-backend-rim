const express = require("express");
const router = express.Router();
const controller = require("../../controllers/Files/filesController");

// router.post("/create-folder" , controller.createFolder);
router.post("/create-file", controller.createfile);
router.post("/create-file-v1", controller.createfilev1);

router.post("/getFilesCount", controller.getFilesCount);
router.post("/getFileActivityLog", controller.getFilesActivityLog);

router.post("/get-file", controller.getfile);
router.post("/update-file", controller.updatefile);
router.post("/delete-file", controller.deleteFile);
router.post("/restore-file", controller.restoreFile);
router.post("/restore-file-temp", controller.restoreFileTemp);


router.post("/delete_permanent", controller.deletePermanent);
router.post("/delete_permanent_temp", controller.deletePermanentTemp);


router.post("/archiev_file", controller.ArchievFile);
router.post("/unarchiev_file", controller.UnArchievFile);
router.post("/UnArchieveFileAll", controller.UnArchieveFileAll);
router.post("/UnArchieveFileSelected", controller.UnArchieveFileSelected);

router.post("/deleteAllTrashPermanent", controller.deleteAllTrashPermanent);
router.post(
  "/deleteSelectedTrashPermanent",
  controller.deleteSelectedTrashPermanent
);

router.post("/restoreTrash", controller.restoreTrash);
router.post("/restoreSelectedTrash", controller.restoreSelectedTrash);

router.post("/saveCanvasDataWithFile_Id", controller.saveCanvasDataWithFile_Id);
router.post(
  "/saveCanvasDataWithFile_IdSave",
  controller.saveCanvasDataWithFile_IdSave
);
router.post(
  "/UpdateCanvasDataWithPosition_Id",
  controller.UpdateCanvasDataWithPosition_Id
);

// signer
router.post("/add-signer", controller.addSigner);
router.post("/getAllSignersByFileId", controller.getAllSignersByFileId);

router.post(
  "/markDocAsCompletedBySigner",
  controller.markDocAsCompletedBySigner
);
// updateFileLog
router.post("/updateFileLog", controller.updateFileLog);

router.post("/update-signer", controller.updateSigner);
router.post("/delete-signer", controller.deleteSigner);
// Recipient
router.post("/add-recipient", controller.addRecipient);
router.post("/delete-recipient", controller.deleteRecipient);

router.post("/getAllRecipientsByFileId", controller.getAllRecipientsByFileId);

router.post("/send-doc-to-esign", controller.sendDocToESign);
router.post("/recipient-log-maintain", controller.recipientLogMaintain);

router.post("/waitingForMeDocLink", controller.waitingForMeDocLink);

// receivedDocEsign
router.post("/received-doc-esign", controller.receivedDocEsign);
router.post("/received-doc-recipient", controller.receivedDocReceipt);

// router.post("/login" , controller.login);
router.put("/rename_folder", controller.updateProfile);
router.post("/upload-file-to-png", controller.uploadFile);
// router.delete("/delete_file",controller.deletefiles)
// router.post("/file_by_user_id",controller.getAllfiles)
router.post("/getbgImagesByFileId", controller.getbgImagesByFileId);
router.post(
  "/getallPositionsFromFile_Id",
  controller.getallPositionsFromFile_Id
);

// router.put("/updatePassword", controller.passwordUpdate);
// router.get("/getAllUsers", controller.getAllCustomers);
// router.post("/getUserById", controller.getCustomerById);
// router.post("/forget-password", controller.forgetPassword);
// router.post("/account-verification", controller.emailverification);
// router.put("/customLogo",controller.customLogo)
// router.put("/customSignature",controller.customSignatures)
// router.put("/customSignaturesDelete",controller.customSignaturesDelete)
// router.put("/customInitialsDelete",controller.customInitialsDelete)
// router.delete("/delete_folder",controller.deleteFolders)
router.post("/files_by_user_id", controller.getAllFolders);
router.post("/getAllFilesTemp", controller.getAllFilesTemp);

router.post("/getAllFilesBySignerEmail", controller.getAllFilesBySignerEmail);
router.post("/trash_files", controller.getTrashFiles);
router.post("/getPermannentDeletedFiles", controller.getPermannentDeletedFiles);
router.post("/getArchieveFiles", controller.getArchieveFiles);
router.post("/change_status", controller.updateStatus);

module.exports = router;
