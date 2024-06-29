const express = require("express");
const router = express.Router();
const controller = require("../../controllers/USERS/customerController");

router.post("/register", controller.registerCustomer);
router.post("/registerV2", controller.registerCustomerV2);
router.post("/login", controller.login);
router.post("/logout", controller.logout);

router.post("/resendRegistrationLink", controller.resendRegistrationLink);
router.post("/activateAccount", controller.activateAccount);
router.post("/forget-password", controller.forgetPassword);
router.post("/updatePasswordBytoken", controller.passwordUpdateToken);
router.post(
  "/checkTokenValidUpdatePassword",
  controller.checkTokenValidUpdatePassword
);

router.post(
  "/updateProfilefirst_time_logged_in",
  controller.updateProfilefirst_time_logged_in
);
router.post("/update_profile", controller.updateProfile);

router.post("/updateIsActive", controller.updateIsActive);

router.post("/delete_user", controller.deleteCustomer);
router.post("/change_status", controller.changeStatus);
router.put("/updatePassword", controller.passwordUpdate);
router.put("/passwordUpdateProf", controller.passwordUpdateProf);

router.get("/getAllUsers", controller.getAllCustomers);
// getAllCustomersTrashed
router.get("/getAllUsersTrashed", controller.getAllCustomersTrashed);
router.post("/getAllUsersTrashedItems", controller.getAllCustomersTrashedItems);
router.post("/getUserById", controller.getCustomerById);
router.post("/getUserByIdAdmin", controller.getCustomerByIdAdmin);

router.post("/account-verification", controller.emailverification);
router.put("/customLogo", controller.customLogo);
router.put("/customSignature", controller.customSignatures);
router.put("/customSignaturesDelete", controller.customSignaturesDelete);
router.put("/customInitialsDelete", controller.customInitialsDelete);

// Signature
router.post("/AddUserSignaturesToDb", controller.AddSignaturesToDb);
router.post("/GetUserSignaturesToDb", controller.GetSignaturesToDb);
router.post("/DeleteSignature", controller.DeleteSignature);

module.exports = router;
