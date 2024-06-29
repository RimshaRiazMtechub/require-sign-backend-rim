const express = require('express');
const router = express.Router();
const controller = require("../../controllers/Folder/folderController")

router.post("/create-folder" , controller.createFolder);
// router.post("/login" , controller.login);
router.post("/rename_folder"  ,  controller.updateProfile);
// router.put("/updatePassword", controller.passwordUpdate);
// router.get("/getAllUsers", controller.getAllCustomers);
// router.post("/getUserById", controller.getCustomerById);
// router.post("/forget-password", controller.forgetPassword);
// router.post("/account-verification", controller.emailverification);
// router.put("/customLogo",controller.customLogo)
// router.put("/customSignature",controller.customSignatures)
// router.put("/customSignaturesDelete",controller.customSignaturesDelete)
// router.put("/customInitialsDelete",controller.customInitialsDelete)
router.post("/delete_folder",controller.deleteFolders)
router.post("/ArchieveFolders",controller.ArchieveFolders)
router.post("/UnArchieveFolders",controller.UnArchieveFolders)
router.post("/folder_by_user_id",controller.getAllFolders)
router.post("/getAllFoldersByUserIds",controller.getAllFoldersByUserIds)


router.post("/get_all_folder_trash",controller.getAllFoldersTrash)
router.post("/getAllFoldersArchieve",controller.getAllFoldersArchieve)
router.post("/change_status",controller.updateStatus)

router.post("/delete_permanent",controller.deletePermanent)
router.post("/restore-folder",controller.restoreFolders)




module.exports = router;