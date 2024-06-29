const { pool } = require("../../config/db.config");
const crypto = require("crypto");
const moment = require("moment");

var nodemailer = require("nodemailer");
const schedule = require("node-schedule");
const imageURL = require("../../EmailImage");
const Emailtemplate = require("../emailUtils");
const urls = require("../../urls");
const nodeScheduletoSendemailForPlan = require("../nodeScheduletoSendemailForPlanUtils");
const WelcomeEmailVerify = require("../../EmailUtils/welcome_email_verify");
const EmailVerify = require("../../EmailUtils/email_verify");
const ResetPasswordEmail = require("../../EmailUtils/reset_password_email");
const EmailVerifyOTP = require("../../EmailUtils/email_verify_otp");

// async function updatePlanStatusInDatabase(email, newStatus, plan_id, first_name, last_name) {
//     // Your database update logic here
//     console.log(`Updating user ${email}'s plan status to ${newStatus}`);
//     // update plan and email that account is inactive
//     // const activatedPlan = planData.rows[0].plan_id
//     const status = "InActive"
//     let query = 'UPDATE user_plan SET ';
//     let index = 2;
//     let values = [plan_id];

//     if (status) {
//         query += `status = $${index} , `;
//         values.push(status)
//         index++
//     }
//     query += 'WHERE plan_id = $1 RETURNING*'
//     query = query.replace(/,\s+WHERE/g, " WHERE");
//     // console.log(query);
//     const result = await pool.query(query, values)
//     // console.log(result)
//     if (result.rows.length === 0) {
//         res.json({ error: true, message: "Some Issue Occur we can't Inactive Subscription " });

//     } else {
//         const activatedPlan = "null"
//         let query1 = 'UPDATE users SET ';
//         let index1 = 2;
//         let values1 = [email];

//         if (activatedPlan) {
//             query1 += `activatedPlan = $${index1} , `;
//             values1.push(activatedPlan)
//             index1++
//         }
//         query1 += 'WHERE email = $1 RETURNING*'
//         query1 = query1.replace(/,\s+WHERE/g, " WHERE");
//         // console.log(query);
//         const resultUser = await pool.query(query1, values1)
//         // console.log(result)
//         if (resultUser.rows.length === 0) {
//             res.json({ error: true, message: "Some Issue Occur we can't Inactive Subscription on User" });

//         } else {
//             //  Inactive Subscription ..Send Email
//             const subject = "Your Subscription Has Expired - Renew Now!"
//             const message = `We hope you've been enjoying your time with our service.
//              Your free trial has expired, but there's no need to worry.
//              Renew your subscription to keep the momentum going!`
//             const btnText = `Avail Subscription`;
//             const resetLink = urls.renew_subscription_url;
//             Emailtemplate(email, resetLink, first_name, last_name, subject, message, btnText);

//             // sendEmailscheduleForplan(email, message, subject, first_name, last_name);
//         }
//     }

// }
// const nodeScheduletoSendemailForPlan = (expirationDate, email, plan_id, first_name, last_name) => {
//     const now = new Date();
//     const daysUntilExpiration = Math.floor((expirationDate - now) / (1000 * 60 * 60 * 24));
//     console.log(daysUntilExpiration)
//     console.log(expirationDate)

//     // Schedule email notifications
//     const twoDaysBeforeExpiration = new Date(expirationDate);
//     //   twoDaysBeforeExpiration.setDate(expirationDate.getDate() - 2);
//     twoDaysBeforeExpiration.setMinutes(expirationDate.getMinutes() - 3);

//     const fourDaysBeforeExpiration = new Date(expirationDate);
//     //   fourDaysBeforeExpiration.setDate(expirationDate.getDate() - 4);
//     fourDaysBeforeExpiration.setMinutes(expirationDate.getMinutes() - 1);

//     schedule.scheduleJob(twoDaysBeforeExpiration, function () {
//         const message = `Your free trial is about to end in just 3 minutes.
//         Don't miss out on all the amazing features and benefits!
//         Renew your subscription now to continue enjoying our services.`;
//         const subject = `Renew Your Subscription - 3 minutes Left!`;
//         const btnText = `Renew Subscription`;
//         const resetLink = urls.renew_subscription_url;

//         Emailtemplate(email, resetLink, first_name, last_name, subject, message, btnText);

//         // sendEmailscheduleForplan(email, message, subject, first_name, last_name);
//     });

//     schedule.scheduleJob(fourDaysBeforeExpiration, function () {
//         const message = `Your free trial is about to end in just 1 minutes.
//         Don't miss out on all the amazing features and benefits!
//         Renew your subscription now to continue enjoying our services.`;
//         const subject = `Renew Your Subscription - 2 minutes Left!`;
//         const btnText = `Renew Subscription`;
//         const resetLink = urls.renew_subscription_url;

//         Emailtemplate(email, resetLink, first_name, last_name, subject, message, btnText);

//         // sendEmailscheduleForplan(email, message, subject, first_name, last_name);
//     });
//     // Schedule status update on expiration date
//     const expirationJob = schedule.scheduleJob(expirationDate, function () {
//         // Update user plan status in the database
//         // Assuming you have a function updatePlanStatusInDatabase(userId) to update the status
//         updatePlanStatusInDatabase(email, 'expired', plan_id, first_name, last_name);
//     });

// }
exports.registerCustomer = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      email,
      first_name,
      last_name,
      password,
      referal_code,
      contact_no,
      avatar,
      company_user,
      company_name,
      company_id,
      last_login_IP,
    } = req.body;
    // const company_user = false;

    const total_doc = 0;
    const total_bulk_links = 0;
    const disk_usage = 0;
    // const plan =[];
    const last_Login = new Date();
    const is_verified = false;
    const is_active = true;

    // const hashedPassword = bcrypt.hashSync(password, 12)
    const salt = "mySalt";
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password + salt)
      .digest("hex");
    // console.log(hashedPassword);
    //         if(company_user==="true"||company_user===true){
    // console.log('ddfeererer')

    const userDataCheck = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (userDataCheck.rows.length === 0) {
      const companyDataCheck = await pool.query(
        "SELECT * FROM company WHERE company_email=$1",
        [email]
      );
      if (companyDataCheck.rows.length === 0) {
        const userData = await pool.query(
          "INSERT INTO users(email, first_name,last_name,company_name, company_id , company_user, contact_no,avatar,password,is_verified,is_active,last_Login,disk_usage,total_doc,total_bulk_links,last_login_IP,referal_code,first_time_logged_in) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) returning *",
          [
            email,
            first_name,
            last_name,
            company_name,
            company_id,
            company_user,
            contact_no,
            avatar,
            // plan,
            hashedPassword,
            is_verified,
            is_active,
            last_Login,
            disk_usage,
            total_doc,
            total_bulk_links,
            last_login_IP,
            referal_code,
            false,
          ]
        );
        // const data = userData.rows[0]
        // console.log(data)
        if (userData.rows.length === 0) {
          console.log("data not exist");
        } else {
          console.log("data exist");
          const current_token = new Date();
          // verification link expire after 1 minute
          const expirationTimestamp = new Date();
          // expirationTimestamp.setMinutes(expirationTimestamp.getMinutes() + 1);
          // for 24 hours
          expirationTimestamp.setDate(expirationTimestamp.getDate() + 1);
          expirationTimestamp.setHours(0, 0, 0, 0); // Set to midnight of tomorrow
          console.log(expirationTimestamp);
          // Free trail expiration after 14 days
          const expirationTimestampPlan = new Date();
          // 5 minutes for testing
          expirationTimestampPlan.setMinutes(
            expirationTimestampPlan.getMinutes() + 5
          );

          // 14 days
          // expirationTimestampPlan.setDate(expirationTimestampPlan.getDate() + 14);
          console.log(expirationTimestampPlan);
          const verifyId = await pool.query(
            "INSERT INTO verificationuseremail(email,expiry_token,current_token) VALUES($1,$2,$3) returning *",
            [
              email,
              expirationTimestamp.toISOString(),
              current_token.toISOString(),
            ]
          );
          if (verifyId.rows.length === 0) {
            res.json({ error: true, message: "something went wrong" });
          } else {
            // console.log(token)
            const token = verifyId.rows[0].verify_id;
            // console.log(token)
            const subject = `Hi from RequireSign – Please verify your account!`;
            const message = `Please2 click the button below to verify your email address to activate your account.`;
            const btnText = `Verify`;
            const resetLink = `${urls.email_verification_url}/${token}`;
            // Email Verification
            // sendVerificationEmail(email, token, first_name, last_name, subject, message); // Call the email sending function
            WelcomeEmailVerify(
              email,
              resetLink,
              first_name,
              last_name,
              subject,
              message,
              btnText
            ); // Call the email sending function

            // Plan Create Free trial
            const subscription_start_date = current_token.toISOString();
            const subscription_end_date = expirationTimestampPlan.toISOString();
            const amount = 0;
            const comment = "Free trail expire after 14 days";

            let user_id = userData.rows[0].user_id;
            const type = "FREE_TRAIL";
            const plan_name = "FREE TRAIL";

            const status = "Active";
            const planData = await pool.query(
              "INSERT INTO user_plan(plan_name, user_id,user_email,subscription_start_date, subscription_end_date , amount, comment,type,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *",
              [
                plan_name,
                user_id,
                email,
                subscription_start_date,
                subscription_end_date,
                amount,
                comment,
                type,
                status,
              ]
            );
            // console.log(planData.rows[0])
            if (planData.rows.length === 0) {
              res.json({
                message: "error assigning plan ",
                error: true,
              });
            } else {
              const activatedPlan = planData.rows[0].plan_id;
              let query = "UPDATE users SET ";
              let index = 2;
              let values = [email];

              if (activatedPlan) {
                query += `activatedPlan = $${index} , `;
                values.push(activatedPlan);
                index++;
              }
              query += "WHERE email = $1 RETURNING*";
              query = query.replace(/,\s+WHERE/g, " WHERE");
              // console.log(query);
              const result = await pool.query(query, values);
              // console.log(result)
              if (result.rows.length === 0) {
                res.json({
                  message: "error assigning plan ",
                  error: true,
                });
              } else {
                // schedule the emails to check the expiration plan
                // ----------SUBSCRIPTION STRIPE -----
                // nodeScheduletoSendemailForPlan(
                //   "user",
                //   expirationTimestampPlan,
                //   email,
                //   activatedPlan,
                //   first_name,
                //   last_name
                // );

                return res.json({
                  error: false,
                  data: userData.rows[0],
                  message: "User Added Successfully. Please verify your Email",
                });
              }
            }
          }
          // end
        }
      } else {
        const data = companyDataCheck.rows[0];

        res.json({ error: true, data, message: "Email Already Exist" });
      }
    } else {
      const data = userDataCheck.rows[0];
      res.json({ error: true, data, message: "Email Already Exist" });
    }
  } catch (err) {
    res.json({ error: true, data: [], message: "Catch eror" });
    console.log(err);
  } finally {
    client.release();
  }
};
exports.registerCustomerV2 = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      email,
      // first_name,
      // last_name,
      password,
      // referal_code,
      // contact_no,
      // avatar,
      // company_user,
      // company_name,
      // company_id,
      last_login_IP,
      companychecked,
    } = req.body;
    // const company_user = false;

    const total_doc = 0;
    const total_bulk_links = 0;
    const disk_usage = 0;
    // const plan =[];
    const last_Login = new Date();
    const is_verified = false;
    const is_active = true;

    // const hashedPassword = bcrypt.hashSync(password, 12)
    const salt = "mySalt";
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password + salt)
      .digest("hex");
    // console.log(hashedPassword);
    //         if(company_user==="true"||company_user===true){
    // console.log('ddfeererer')

    const userDataCheck = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (userDataCheck.rows.length === 0) {
      const userData = await pool.query(
        "INSERT INTO users(email , company_user,password,is_verified,is_active,last_Login,disk_usage,total_doc,total_bulk_links,first_time_logged_in) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *",
        [
          email,
          companychecked,
          // contact_no,
          // plan,
          hashedPassword,
          is_verified,
          is_active,
          last_Login,
          disk_usage,
          total_doc,
          total_bulk_links,
          // last_login_IP,
          // referal_code,
          false,
        ]
      );
      // const data = userData.rows[0]
      // console.log(data)
      if (userData.rows.length === 0) {
        res.json({ error: true, message: "data not exist" });
      } else {
        const current_token = new Date();
        // verification link expire after 1 minute
        const expirationTimestamp = new Date();
        // expirationTimestamp.setMinutes(expirationTimestamp.getMinutes() + 1);
        // for 24 hours
        expirationTimestamp.setDate(expirationTimestamp.getDate() + 1);
        expirationTimestamp.setHours(0, 0, 0, 0); // Set to midnight of tomorrow
        console.log(expirationTimestamp);
        // Free trail expiration after 14 days
        const expirationTimestampPlan = new Date();
        // 5 minutes for testing
        expirationTimestampPlan.setMinutes(
          expirationTimestampPlan.getMinutes() + 5
        );

        // 14 days
        // expirationTimestampPlan.setDate(expirationTimestampPlan.getDate() + 14);
        console.log(expirationTimestampPlan);
        const verifyId = await pool.query(
          "INSERT INTO verificationuseremail(email,expiry_token,current_token) VALUES($1,$2,$3) returning *",
          [
            email,
            expirationTimestamp.toISOString(),
            current_token.toISOString(),
          ]
        );
        if (verifyId.rows.length === 0) {
          res.json({ error: true, message: "something went wrong" });
        } else {
          // console.log(token)
          // get from pricing table where type = FREE
          const userPlan = await pool.query(
            "SELECT * FROM pricing WHERE type=$1",
            ["FREE"]
          );
          console.log(userPlan.rows[0]);
          let pricing_id = userPlan.rows[0].pricing_id;
          let pricing = userPlan.rows[0].monthly_price;

          let subscription_start_date = new Date();
          // subscritpion end date should be 30 days after today
          let subscription_end_date = new Date();
          subscription_end_date.setDate(subscription_end_date.getDate() + 30);
          console.log(subscription_end_date);
          //  insert into user_plan
          const type = "monthly";
          const status = "active";
          const userPlanData = await pool.query(
            "INSERT INTO user_plan(plan_id, user_id,subscription_start_date, subscription_end_date,type,amount,status) VALUES($1,$2,$3,$4,$5,$6,$7) returning *",
            [
              pricing_id,
              userData.rows[0].user_id,
              subscription_start_date,
              subscription_end_date,
              type,
              pricing,
              status,
            ]
          );
          if (userPlanData.rows.length === 0) {
            console.log("ERROR Subscription Free created");
          } else {
            console.log("Subscription Free created");
          }

          const token = verifyId.rows[0].verify_id;
          // console.log(token)
          const subject = `Hi from RequireSign – Please verify your account!`;
          const message = `Please click the button below to verify your email address to activate your account.`;
          const btnText = `Verify`;
          const resetLink = `${urls.email_verification_url}/${token}`;
          // Email Verification
          const first_name = email;
          const last_name = "";
          // sendVerificationEmail(email, token, first_name, last_name, subject, message); // Call the email sending function
          WelcomeEmailVerify(
            email,
            resetLink,
            first_name,
            last_name,
            subject,
            message,
            btnText
          ); // Call the email sending function

          // Plan Create Free trial
          // const subscription_start_date = current_token.toISOString();
          // const subscription_end_date = expirationTimestampPlan.toISOString();
          // const amount = 0;
          // const comment = "Free trail expire after 14 days";

          // let user_id = userData.rows[0].user_id;
          // const type = "FREE_TRAIL";
          // const plan_name = "FREE TRAIL";

          // const status = "Active";
          // const planData = await pool.query(
          //   "INSERT INTO user_plan(plan_name, user_id,user_email,subscription_start_date, subscription_end_date , amount, comment,type,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *",
          //   [
          //     plan_name,
          //     user_id,
          //     email,
          //     subscription_start_date,
          //     subscription_end_date,
          //     amount,
          //     comment,
          //     type,
          //     status,
          //   ]
          // );
          // // console.log(planData.rows[0])
          // if (planData.rows.length === 0) {
          //   res.json({
          //     message: "error assigning plan ",
          //     error: true,
          //   });
          // } else {
          //   const activatedPlan = planData.rows[0].plan_id;
          //   let query = "UPDATE users SET ";
          //   let index = 2;
          //   let values = [email];

          //   if (activatedPlan) {
          //     query += `activatedPlan = $${index} , `;
          //     values.push(activatedPlan);
          //     index++;
          //   }
          //   query += "WHERE email = $1 RETURNING*";
          //   query = query.replace(/,\s+WHERE/g, " WHERE");
          //   // console.log(query);
          //   const result = await pool.query(query, values);
          //   // console.log(result)
          //   if (result.rows.length === 0) {
          //     res.json({
          //       message: "error assigning plan ",
          //       error: true,
          //     });
          //   } else {
          // schedule the emails to check the expiration plan
          // ----------SUBSCRIPTION STRIPE -----
          // nodeScheduletoSendemailForPlan(
          //   "user",
          //   expirationTimestampPlan,
          //   email,
          //   activatedPlan,
          //   first_name,
          //   last_name
          // );

          return res.json({
            error: false,
            data: userData.rows[0],
            message: "User Added Successfully. Please verify your Email",
          });
          //   }
          // }
        }
      }
    } else {
      const data = userDataCheck.rows[0];
      res.json({ error: true, data, message: "Email Already Exist" });
    }
  } catch (err) {
    res.json({ error: true, data: [], message: "Catch eror" });
    console.log(err);
  } finally {
    client.release();
  }
};

exports.deleteCustomer = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const user_ids = req.body.user_ids; // Array of objects {item: id}

    // Start a transaction
    await client.query("BEGIN");

    // Perform the deletion queries
    const tables = [
      "users",
      "user_plan",
      "Files",
      "Folder",
      "bulk_links",
      "template",
      "audit_log",
    ];
    for (let user of user_ids) {
      for (let table of tables) {
        await client.query(`DELETE FROM ${table} WHERE user_id = $1`, [
          user.item,
        ]);
      }
    }

    // Commit the transaction
    await client.query("COMMIT");

    res.json({
      error: false,
      message: "Users and related data Deleted Successfully",
    });
  } catch (err) {
    // If an error occurred, rollback the transaction
    await client.query("ROLLBACK");
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
exports.changeStatus = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const company_ids = req.body.user_ids; // Array of objects {item: id, name: 'name'}
    const status = req.body.status;
    console.log(company_ids);
    console.log(status);

    if (!Array.isArray(company_ids) || company_ids.length === 0) {
      return res.json({
        message: "Invalid user_ids provided.",
        status: false,
      });
    }

    let query = "UPDATE users SET ";
    let index = 1;
    let values = [];

    if (status !== undefined) {
      // Check if status is not undefined
      query += `is_active = $${index}, `;
      values.push(status);
      index++;
    }

    query = query.slice(0, -2); // Remove the trailing comma and space after the last updated field.

    query += " WHERE user_id IN (";

    for (const item of company_ids) {
      query += `$${index},`;
      values.push(item.item); // Extract the user id from the item property
      index++;
    }

    // Remove the trailing comma and close the IN clause.
    query = query.slice(0, -1) + ") RETURNING *";

    const result = await pool.query(query, values);
    // console.log(result);

    if (result.rows.length === 0) {
      res.json({
        message: "No records updated",
        error: true,
      });
    } else {
      res.json({
        message: "User Status has been Updated Successfully",
        error: false,
        result: result.rows,
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      error: true,
      data: err.message,
    });
  } finally {
    client.release();
  }
};

exports.activateAccount = async (req, res) => {
  try {
    const { verify_id } = req.body;
    const userData = await pool.query(
      "SELECT * FROM verificationuseremail WHERE verify_id = $1",
      [verify_id]
    );
    console.log(userData);
    if (userData.rows.length === 0) {
      res.json({
        error: true,
        errormsg: "invalid",
        message: "Invalid verification",
      });
    } else {
      const email = userData.rows[0].email;
      let userDataID = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );
      let user_id_log = userDataID.rows[0].user_id;
      console.log("Email");
      console.log(userDataID.rows[0].user_id);

      if (
        userData.rows[0].expiry_token === null ||
        userData.rows[0].expiry_token === undefined
      ) {
        console.log("The token is still valid.");
        const is_verified = true;
        // Update Status  Account verified true
        let query = "UPDATE users SET ";
        let index = 2;
        let values = [email];

        if (is_verified) {
          query += `is_verified = $${index} , `;
          values.push(is_verified);
          index++;
        }
        query += "WHERE email = $1 RETURNING*";
        query = query.replace(/,\s+WHERE/g, " WHERE");
        // console.log(query);
        const result = await pool.query(query, values);
        // console.log(result)
        if (result.rows[0].length === 0) {
          res.json({
            message: "Record could not be updated",
            error: true,
          });
        } else {
          // send email
          // console.log(token)
          // console.log(token)
          const userDetail = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
          );
          if (userDetail.rows[0].length === 0) {
            res.json({
              message: "User Doesnot Exist",
              error: true,
            });
          } else {
            let user_idLog = userDetail.rows[0].user_id;
            const comp_name = userDetail.rows[0].company_name;
            const subject = `Account Activated!`;
            const message = `Now you can login with  ${comp_name} subdomain.`;
            const btnText = `Login`;
            const resetLink = urls.login_url;
            const first_name = userDetail.rows[0].first_name;
            const last_name = userDetail.rows[0].last_name;
            // Email Verification
            // sendVerificationEmail(email, token, first_name, last_name, subject, message); // Call the email sending function
            Emailtemplate(
              email,
              resetLink,
              first_name,
              last_name,
              subject,
              message,
              btnText
            ); // Call the email sending function

            res.json({
              error: false,
              userDataID: userDataID.rows[0],
              message: "Account Activation Successfully",
              paragraph: `${email} has been activated successfully. User will receive email shortly.`,
            });
          }
        }
      } else {
        const currentDateTime = new Date();
        const expiryDateTime = new Date(userData.rows[0].expiry_token);
        const dataToken = userData.rows[0];
        const email = userData.rows[0].email;

        if (currentDateTime > expiryDateTime) {
          console.log("The token has expired.");
          res.json({
            error: true,
            errormsg: "tokenexpired",
            data: dataToken,
            message: "Your Registrtaion Token is expired",
          });
        } else {
          console.log("The token is still valid.");
          const is_verified = true;
          // Update Status  Account verified true
          let query = "UPDATE users SET ";
          let index = 2;
          let values = [email];

          if (is_verified) {
            query += `is_verified = $${index} , `;
            values.push(is_verified);
            index++;
          }
          query += "WHERE email = $1 RETURNING*";
          query = query.replace(/,\s+WHERE/g, " WHERE");
          // console.log(query);
          const result = await pool.query(query, values);
          // console.log(result)
          if (result.rows[0]) {
            res.json({
              userDataID: userDataID.rows[0],
              error: false,
              message: "Account Activation Successfully",
            });
          } else {
            res.json({
              message: "Record could not be updated",
              error: true,
            });
          }
        }
      }
    }
  } catch (err) {
    res.json({ error: true, message: err });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const salt = "mySalt";
    const userData = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userData.rows.length === 0) {
      res.json({
        error: true,
        errormsg: "invalid",
        message: "Invalid Credentials",
      });
      // const companyData = await pool.query(
      //   "SELECT * FROM company WHERE company_email = $1",
      //   [email]
      // );
      // if (companyData.rows.length === 0) {
      //   res.json({
      //     error: true,
      //     errormsg: "invalid",
      //     message: "Invalid Email Address",
      //   });
      // } else {
      //   if (
      //     companyData.rows[0].is_verified === true ||
      //     companyData.rows[0].is_verified === "true"
      //   ) {
      //     const hashedPasswordFromDb = companyData.rows[0].password;
      //     const hashedUserEnteredPassword = crypto
      //       .createHash("sha256")
      //       .update(password + salt)
      //       .digest("hex");

      //     if (hashedPasswordFromDb === hashedUserEnteredPassword) {
      //       res.json({
      //         error: false,
      //         data: companyData.rows[0],
      //         user_type: "company",
      //         message: "Login Successfully",
      //       });
      //     } else {
      //       res.json({
      //         error: true,
      //         errormsg: "invalid",
      //         message: "Invalid Credentials",
      //       });
      //     }
      //   } else {
      //     res.json({
      //       error: true,
      //       errormsg: "invalid",
      //       message: "Your account is not activated yet .",
      //     });
      //   }
      // }
    } else {
      const company_user = userData.rows[0].company_user;
      if (company_user === true) {
        if (
          userData.rows[0].is_verified === true ||
          userData.rows[0].is_verified === "true"
        ) {
          const hashedPasswordFromDb = userData.rows[0].password;
          const hashedUserEnteredPassword = crypto
            .createHash("sha256")
            .update(password + salt)
            .digest("hex");

          if (hashedPasswordFromDb === hashedUserEnteredPassword) {
            res.json({
              error: false,
              data: userData.rows[0],
              user_type: "company_user",
              message: "Login Successfully",
            });
          } else {
            res.json({
              error: true,
              errormsg: "invalid",
              message: "Invalid Credentials",
            });
          }
        } else {
          res.json({
            error: true,
            errormsg: "invalid",
            message: "Your account is not activated by company .",
          });
        }
      } else {
        // console.log(userData.rows[0])
        if (
          userData.rows[0].is_verified === true ||
          userData.rows[0].is_verified === "true"
        ) {
          const hashedPasswordFromDb = userData.rows[0].password;
          const hashedUserEnteredPassword = crypto
            .createHash("sha256")
            .update(password + salt)
            .digest("hex");

          if (hashedPasswordFromDb === hashedUserEnteredPassword) {
            res.json({
              error: false,
              data: userData.rows[0],
              user_type: "user",
              message: "Login Successfully",
            });
          } else {
            res.json({
              error: true,
              errormsg: "invalid",
              message: "Invalid Credentials",
            });
          }
        } else {
          res.json({
            error: true,
            errormsg: "NotVerifiedAccount",
            message: "Please verify your Email to continue",
          });
        }
      }
    }
  } catch (err) {
    res.json({ error: true, message: err });
    console.log(err);
  }
};
// removed
exports.logout = async (req, res) => {
  {
    try {
      const { user_id, location_country, ip_address, location_date, timezone } =
        req.body;
      const event_type = "LOGOUT";
      const audit_result = await pool.query(
        "INSERT INTO audit_log(user_id,event,location_country,ip_address,location_date,timezone) VALUES($1,$2,$3,$4,$5,$6) returning *",
        [
          user_id,
          event_type,
          location_country,
          ip_address,
          location_date,
          timezone,
        ]
      );
      if (audit_result.rows.length === 0) {
        res.json({
          message: "Could not Maintain Log",
          error: true,
        });
        console.log("LOG MAINTAIN ERROR SIGN IN");
      } else {
        res.json({
          message: "Maintained Log",
          error: true,
        });
        console.log("SUCCESS LOG SIGN IN ");
      }
    } catch (err) {
      res.json({ error: true, message: err });
      console.log(err);
    }
  }
};
exports.resendRegistrationLink = async (req, res) => {
  const client = await pool.connect();
  try {
    const email = req.body.email;
    const expiry_token = new Date();
    const current_token = new Date();
    // 1 minjute expiry for test
    // 24 hours format
    expiry_token.setDate(expiry_token.getDate() + 1);
    expiry_token.setHours(0, 0, 0, 0); // Set to midnight of tomorrow
    console.log(expiry_token);
    // expiry_token.setMinutes(expiry_token.getMinutes() + 1);
    // delete previous record
    const deleteQuery = "DELETE FROM verificationuseremail WHERE email = $1";

    const DeletedRecord = await pool.query(deleteQuery, [email]);
    console.log(
      `Deleted ${DeletedRecord.rowCount} records for email: ${email}`
    );

    const result = await pool.query(
      "INSERT INTO verificationuseremail(email,expiry_token,current_token) VALUES($1,$2,$3) returning *",
      [email, expiry_token.toISOString(), current_token.toISOString()]
    );
    if (result.rows.length === 0) {
      res.json({
        message: "Could not Send Verification Link",
        status: false,
      });
    } else {
      const token = result.rows[0].verify_id;

      const userData = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );
      if (userData.rows.length === 0) {
        res.json({
          message: "Could not Send Verification Link",
          status: false,
        });
      } else {
        const first_name = userData.rows[0].first_name;
        const last_name = userData.rows[0].last_name;
        const subject = `Verify email to activate your account`;
        const message = `You can verify your account by using the resend verification link we've provided`;
        const btnText = `Verify`;
        const resetLink = `${urls.email_verification_url}/${token}`;

        EmailVerify(
          email,
          resetLink,
          first_name,
          last_name,
          subject,
          message,
          btnText
        ); // Call the email sending function
        // sendVerificationEmail(email, token, first_name, last_name, subject, message)
        // sendVerificationEmailResend(email, token); // Call the email sending function
        return res.json({ error: false, message: "resend Link send " });
      }
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      status: false,
      error: err.message,
    });
  } finally {
    client.release();
  }
};
exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const userData = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userData.rows.length === 0) {
      // res.json({ error: true, message: "Email Not Registered" });
      const companyData = await pool.query(
        "SELECT * FROM company WHERE company_email = $1",
        [email]
      );
      if (companyData.rows.length === 0) {
        res.json({ error: true, message: "Email Not Registered" });
      } else {
        const verifyId = await pool.query(
          "INSERT INTO verification(email) VALUES($1) returning *",
          [email]
        );
        if (verifyId.rows.length === 0) {
          res.json({ error: true, message: "Can't Verify Right Now" });
        } else {
          const data = verifyId.rows[0].verify_id;
          const message = `Please click the button below to update password for your account.`;
          const subject = `Update Password Request`;
          const first_name = companyData.rows[0].company_name;
          const last_name = "";
          const resetLink = `${urls.password_update_user_url}?token=${data}`;
          const btnText = "Update Password";
          ResetPasswordEmail(
            email,
            resetLink,
            first_name,
            last_name,
            subject,
            message,
            btnText
          );

          // Call the email sending function
          // sendupdatePasswordEmail(email, message, subject, first_name, last_name, resetToken)
          return res.json({
            error: false,
            data: companyData.rows[0],
            message:
              "Update Password Link send to your email. Please verify your Email",
          });
        }
      }
    } else {
      let user_id_log = userData.rows[0].user_id;
      // const token = crypto.randomBytes(20).toString('hex');
      // console.log(token)
      // check verification table if email exist
      const emailExist = await pool.query(
        "SELECT * FROM verification WHERE email=$1",
        [email]
      );
      let verifyId;
      if (emailExist.rows.length === 0) {
        verifyId = await pool.query(
          "INSERT INTO verification(email) VALUES($1) returning *",
          [email]
        );
      } else {
        const verify_idData = emailExist.rows[0].verify_id;
        verifyId = await pool.query(
          `UPDATE verification SET email=$1 , created_at=NOW() WHERE verify_id=$2 returning *`,
          [email, verify_idData]
        );
      }

      if (verifyId.rows.length === 0) {
        res.json({ error: true, message: "Can't Verify Right Now" });
      } else {
        const data = verifyId.rows[0].verify_id;
        const message = `Please click the button below to update password for your account.`;
        const subject = `Update Password Request`;
        const first_name = userData.rows[0].first_name;
        const last_name = userData.rows[0].last_name;
        const resetLink = `${urls.password_update_user_url}?token=${data}`;
        const btnText = "Update Password";
        ResetPasswordEmail(
          email,
          resetLink,
          first_name,
          last_name,
          subject,
          message,
          btnText
        ); // Call the email sending function
        // audit-log

        // sendupdatePasswordEmail(email, message, subject, first_name, last_name, resetToken)
        return res.json({
          error: false,
          data: userData.rows[0],
          message:
            "Update Password Link send to your email. Please verify your Email",
        });
      }
    }
  } catch (error) {
    res.status(500).json(error);
  }
};
exports.checkTokenValidUpdatePassword = async (req, res) => {
  const client = await pool.connect();
  try {
    const { verifyId } = req.body;
    const userData = await pool.query(
      "SELECT * FROM verification WHERE verify_id = $1",
      [verifyId]
    );
    if (userData.rows.length === 0) {
      res.json({
        message: "INVALID TOKEN",
        error: true,
      });
    } else {
      const created_at = userData.rows[0].created_at;
      const tokenCreationTime = moment(created_at);
      const currentTime = moment();
      const hoursPassed = currentTime.diff(tokenCreationTime, "hours");

      // if (hoursPassed > 1) {
      //   res.json({
      //     message: "TOKEN EXPIRED",
      //     error: true,
      //   });
      // } else {
      console.log(created_at);
      res.json({
        message: "VALID TOKEN",
        error: false,
      });
      // }
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      status: false,
      error: err.message,
    });
  } finally {
    client.release();
  }
};
exports.passwordUpdateToken = async (req, res) => {
  const client = await pool.connect();
  try {
    const { token, password } = req.body;
    const salt = "mySalt";
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password + salt)
      .digest("hex");
    // console.log(hashedPassword);
    const userDataCheck = await pool.query(
      "SELECT * FROM verification WHERE verify_id=$1",
      [token]
    );
    console.log(userDataCheck.rows);
    if (userDataCheck.rows.length === 0) {
      // const data=userDataCheck.rows[0]
      res.json({ error: true, data: [], message: "Invalid Request" });
    } else {
      const email = userDataCheck.rows[0].email;
      // check user or company
      const Type = await pool.query("SELECT * FROM users WHERE email=$1", [
        email,
      ]);
      if (Type.rows.length === 0) {
        let user_id_log = Type.rows[0].user_id;
        const userData = await pool.query(
          `UPDATE users SET password=$1 WHERE email=$2 returning *`,
          [hashedPassword, email]
        );
        // Expire code
        const checkQuery = "DELETE FROM verification WHERE email = $1";
        const checkResult = await pool.query(checkQuery, [email]);
        const data = userData.rows[0];

        res.json({ error: false, data, message: "Updated Successfully" });
      } else {
        let user_id_log = Type.rows[0].user_id;
        // const company = await pool.query(
        //     "SELECT * FROM company WHERE company_email=$1",
        //     [email]
        // );
        // if (company.rows.length === 0) {
        //     res.json({ error: true, data: [], message: "Token Expired" });
        // } else {
        const userData = await pool.query(
          `UPDATE users SET password=$1 WHERE email=$2 returning *`,
          [hashedPassword, email]
        );
        // Expire code
        const checkQuery = "DELETE FROM verification WHERE email = $1";
        const checkResult = await pool.query(checkQuery, [email]);
        const data = userData.rows[0];

        res.json({ error: false, data, message: "Updated Successfully" });
        // }
      }
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      error: true,
      error: err.message,
    });
  } finally {
    client.release();
  }
};
exports.emailverification = async (req, res) => {
  try {
    const { email } = req.body;
    // const userData = await pool.query("SELECT * FROM customers WHERE email = $1", [email]);
    // if (userData.rows.length === 0) {
    //     res.json({ error: true, message: "Email Not Registered" });
    // } else {
    // create nodemailer transporter
    const first_name = email;
    const last_name = "";
    const subject = `Email OTP Verification`;
    const message = `Enter the OTP provided below so you can access the link document.`;
    const otpCode = Math.floor(100000 + Math.random() * 900000);
    console.log(otpCode);
    const btnText = otpCode;

    // const resetLink = `${urls.email_verification_url}/${token}`;

    EmailVerifyOTP(
      email,
      otpCode,
      first_name,
      last_name,
      subject,
      message,
      btnText
    );

    // generate random 6-digit OTP code
    // const otpCode = Math.floor(100000 + Math.random() * 900000);
    // console.log(otpCode);
    res
      .status(200)
      .json({ message: "OTP code sent successfully", otp: otpCode });
  } catch (error) {
    res.status(500).json(error);
  }
};
// update is_active ststau to user by user_id
exports.updateIsActive = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.user_id;
    const is_active = req.body.is_active;
    const query = `UPDATE users SET is_active = $1 WHERE user_id = $2 returning *`;
    const values = [is_active, user_id];
    const result = await pool.query(query, values);
    const data = result.rows[0];
    res.json({ error: false, data, message: "Updated Successfully" });
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      error: true,
      error: err.message,
    });
  } finally {
    client.release();
  }
};

exports.updateProfile = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      user_id,
      first_name,
      last_name,
      contact_no,
      company_name,
      account_verified,
      referal_code,
      company_user,
      avatar,
      signature_image_url,
    } = req.body;
    console.log("user_id");

    console.log(user_id);

    let query = "UPDATE users SET ";
    let index = 2;
    let values = [user_id];

    if (first_name) {
      query += `first_name = $${index} , `;
      values.push(first_name);
      index++;
    }
    if (last_name) {
      query += `last_name = $${index} , `;
      values.push(last_name);
      index++;
    }
    if (contact_no) {
      query += `contact_no = $${index} , `;
      values.push(contact_no);
      index++;
    }
    if (company_name) {
      query += `company_name = $${index} , `;
      values.push(company_name);
      index++;
    }
    if (account_verified) {
      query += `account_verified = $${index} , `;
      values.push(account_verified);
      index++;
    }
    if (referal_code) {
      query += `referal_code = $${index} , `;
      values.push(referal_code);
      index++;
    }
    if (company_user) {
      query += `company_user = $${index} , `;
      values.push(company_user);
      index++;
    }
    if (signature_image_url) {
      query += `signature_image_url = $${index} , `;
      values.push(signature_image_url);
      index++;
    }
    if (avatar) {
      query += `avatar = $${index} , `;
      values.push(avatar);
      index++;
    }

    query += "WHERE user_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);
    console.log(result);
    if (result.rows.length > 0) {
      res.json({
        message: "Record Updated",
        error: false,
        result: result.rows[0],
      });
    } else {
      res.json({
        message: "Record could not be updated",
        error: true,
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      error: true,
      error_message: err.message,
    });
  } finally {
    client.release();
  }
};
exports.updateProfilefirst_time_logged_in = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.user_id;
    let query = "UPDATE users SET ";
    let index = 2;
    let values = [user_id];
    const first_time_logged_in = "true";
    if (first_time_logged_in) {
      query += `first_time_logged_in = $${index} , `;
      values.push(first_time_logged_in);
      index++;
    }
    query += "WHERE user_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);

    // console.log(result)

    if (result.rows[0]) {
      res.json({
        message: "Record Updated",
        error: false,
        data: result.rows[0],
      });
    } else {
      res.json({
        message: "Record could not be updated",
        error: true,
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      status: false,
      error: err.message,
    });
  } finally {
    client.release();
  }
};

exports.passwordUpdate = async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password } = req.body;
    const salt = "mySalt";
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password + salt)
      .digest("hex");
    // console.log(hashedPassword);
    const userDataCheck = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );
    // res.json(userDataCheck.rows)
    if (userDataCheck.rows.length === 0) {
      // const data=userDataCheck.rows[0]
      res.json({ error: true, data: [], message: "Email Doesnot Exist" });
    } else {
      const user_id_log = userDataCheck.rows[0].user_id;
      const userData = await pool.query(
        `UPDATE users SET password=$1 WHERE email=$2 returning *`,
        [hashedPassword, email]
      );

      const data = userData.rows[0];
      res.json({ error: false, data, message: "Updated Successfully" });
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      error: true,
      error_message: err.message,
    });
  } finally {
    client.release();
  }
};

exports.passwordUpdateProf = async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, old_password, password } = req.body;
    const salt = "mySalt";
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password + salt)
      .digest("hex");
    const hashedOLDPassword = crypto
      .createHash("sha256")
      .update(old_password + salt)
      .digest("hex");
    // console.log(hashedPassword);
    const userDataCheck = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );
    // res.json(userDataCheck.rows)
    if (userDataCheck.rows.length === 0) {
      // const data=userDataCheck.rows[0]
      res.json({ error: true, data: [], message: "Email Doesnot Exist" });
    } else {
      const user_id_log = userDataCheck.rows[0].user_id;
      const password = userDataCheck.rows[0].password;
      if (password === hashedOLDPassword) {
        const userData = await pool.query(
          `UPDATE users SET password=$1 WHERE email=$2 returning *`,
          [hashedPassword, email]
        );
        const data = userData.rows[0];
        res.json({ error: false, data, message: "Updated Successfully" });
      } else {
        res.json({ error: true, message: "Old Password wrong" });
      }
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Can't Update Right Now!",
      error: true,
      error_message: err.message,
    });
  } finally {
    client.release();
  }
};
// get all users with count of folders,files, templates is_deleted true fetch all

exports.getAllCustomersTrashed = async (req, res) => {
  const client = await pool.connect();
  try {
    const users = await client.query(
      "SELECT * FROM users ORDER BY created_at DESC"
    );

    for (let user of users.rows) {
      const deleted_folder_count = await client.query(
        "SELECT COUNT(*) FROM Folder WHERE user_id = $1 AND is_trash_deleted = true",
        [user.user_id]
      );
      const trash_folder_count = await client.query(
        "SELECT COUNT(*) FROM Folder WHERE user_id = $1 AND is_deleted = true AND is_trash_deleted = false",
        [user.user_id]
      );
      const deleted_files_count = await client.query(
        "SELECT COUNT(*) FROM Files WHERE user_id = $1 AND is_trash_deleted = true",
        [user.user_id]
      );
      const trash_files_count = await client.query(
        "SELECT COUNT(*) FROM Files WHERE user_id = $1 AND is_deleted = true AND is_trash_deleted = false",
        [user.user_id]
      );

      const deleted_templates_count = await client.query(
        "SELECT COUNT(*) FROM template WHERE user_id = $1 AND is_trash_deleted = true",
        [user.user_id]
      );
      const trash_templates_count = await client.query(
        "SELECT COUNT(*) FROM template WHERE user_id = $1 AND is_deleted = true AND is_trash_deleted = false",
        [user.user_id]
      );

      user.deleted_folder_count = deleted_folder_count.rows[0].count;
      user.trash_folder_count = trash_folder_count.rows[0].count;
      user.deleted_files = deleted_files_count.rows[0].count;
      user.deleted_templates = deleted_templates_count.rows[0].count;
      user.trash_files = trash_files_count.rows[0].count;
      user.trash_templates = trash_templates_count.rows[0].count;
    }

    res.json({
      message: "All Users Fetched",
      error: false,
      result: users.rows,
    });
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      error: true,
      errorMsg: err.message,
    });
  } finally {
    client.release();
  }
};
exports.getAllCustomersTrashedItems = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.user_id;
    const users = await client.query(
      "SELECT * FROM users WHERE user_id=$1 ORDER BY created_at DESC",
      [user_id]
    );

    for (let user of users.rows) {
      const deleted_folder_count = await client.query(
        "SELECT * FROM Folder WHERE user_id = $1 AND is_trash_deleted = true",
        [user.user_id]
      );
      const trash_folder_count = await client.query(
        "SELECT * FROM Folder WHERE user_id = $1 AND is_deleted = true AND is_trash_deleted = false",
        [user.user_id]
      );
      const deleted_files_count = await client.query(
        "SELECT * FROM Files WHERE user_id = $1 AND is_trash_deleted = true",
        [user.user_id]
      );
      const trash_files_count = await client.query(
        "SELECT * FROM Files WHERE user_id = $1 AND is_deleted = true AND is_trash_deleted = false",
        [user.user_id]
      );

      const deleted_templates_count = await client.query(
        "SELECT * FROM template WHERE user_id = $1 AND is_trash_deleted = true",
        [user.user_id]
      );
      const trash_templates_count = await client.query(
        "SELECT * FROM template WHERE user_id = $1 AND is_deleted = true AND is_trash_deleted = false",
        [user.user_id]
      );

      user.deleted_folder_count = deleted_folder_count.rows;
      user.trash_folder_count = trash_folder_count.rows;
      user.deleted_files = deleted_files_count.rows;
      user.deleted_templates = deleted_templates_count.rows;
      user.trash_files = trash_files_count.rows;
      user.trash_templates = trash_templates_count.rows;
    }

    res.json({
      message: "All Users Fetched",
      error: false,
      result: users.rows,
    });
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      error: true,
      errorMsg: err.message,
    });
  } finally {
    client.release();
  }
};

exports.getAllCustomers = async (req, res) => {
  const client = await pool.connect();
  try {
    const query = `
    SELECT users.*, 
(SELECT COUNT(*) FROM Files WHERE Files.user_id = users.user_id::text AND is_deleted = false AND is_trash_deleted = false) AS files_count,
(SELECT COUNT(*) FROM Folder WHERE Folder.user_id = users.user_id::text AND is_deleted = false AND is_trash_deleted = false) AS folders_count,
(SELECT COUNT(*) FROM template WHERE template.user_id = users.user_id::text AND is_deleted = false AND is_trash_deleted = false) AS templates_count,
(SELECT COUNT(*) FROM bulk_links WHERE bulk_links.user_id = users.user_id::text) AS bulk_links_count
FROM users
  ORDER BY created_at DESC`;
    const result = await pool.query(query);

    if (result.rows) {
      res.json({
        message: "All Users Fetched",
        error: false,
        result: result.rows,
      });
    } else {
      res.json({
        message: "could not fetch",
        error: true,
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      error: true,
      errorMsg: err.message,
    });
  } finally {
    client.release();
  }
};

exports.getCustomerById = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.user_id;

    if (!user_id) {
      return res.json({
        message: "Please provide user_id",
        error: true,
      });
    }
    const query = "SELECT * FROM users WHERE user_id = $1";
    const result = await pool.query(query, [user_id]);

    const query1 = "SELECT * FROM user_plan WHERE user_id = $1";
    const result1 = await pool.query(query1, [user_id]);

    if (result.rows[0]) {
      res.json({
        message: "Users fetched",
        error: false,
        result: result.rows,
        result1: result1.rows,
      });
    } else {
      res.json({
        message: "could not fetch",
        error: true,
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      error: true,
      errorMsg: err.message,
    });
  } finally {
    client.release();
  }
};
exports.getCustomerByIdAdmin = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.user_id;

    if (!user_id) {
      return res.json({
        message: "Please provide user_id",
        error: true,
      });
    }

    const userQuery = "SELECT * FROM users WHERE user_id = $1";
    const userResult = await client.query(userQuery, [user_id]);

    if (!userResult.rows[0]) {
      return res.json({
        message: "User not found",
        error: true,
      });
    }

    const folderQuery =
      "SELECT * FROM Folder WHERE user_id = $1 AND is_deleted = false AND is_trash_deleted = false";
    const folderResult = await client.query(folderQuery, [user_id]);

    const fileQuery =
      "SELECT * FROM Files WHERE user_id = $1 AND is_deleted = false AND is_trash_deleted = false";
    const fileResult = await client.query(fileQuery, [user_id]);

    const templateQuery =
      "SELECT * FROM template WHERE user_id = $1 AND is_deleted = false AND is_trash_deleted = false";
    const templateResult = await client.query(templateQuery, [user_id]);

    const bulkLinkQuery = "SELECT * FROM bulk_links WHERE user_id = $1";
    const bulkLinkResult = await client.query(bulkLinkQuery, [user_id]);

    const auditLogQuery = "SELECT * FROM audit_log WHERE user_id = $1";
    const auditLogResult = await client.query(auditLogQuery, [user_id]);

    // Fetch logs for each file
    for (let file of fileResult.rows) {
      const fileLogQuery = "SELECT * FROM file_log WHERE file_id = $1";
      const fileLogResult = await client.query(fileLogQuery, [file.file_id]);
      file.logs = fileLogResult.rows;
    }

    // Fetch logs for each template
    for (let template of templateResult.rows) {
      const templateLogQuery =
        "SELECT * FROM template_log WHERE template_id = $1";
      const templateLogResult = await client.query(templateLogQuery, [
        template.template_id,
      ]);
      template.logs = templateLogResult.rows;
    }

    // Fetch logs for each bulk link
    for (let bulkLink of bulkLinkResult.rows) {
      const bulkLinkLogQuery =
        "SELECT * FROM bulk_link_log WHERE bulk_link_id = $1";
      const bulkLinkLogResult = await client.query(bulkLinkLogQuery, [
        bulkLink.bulk_link_id,
      ]);
      bulkLink.logs = bulkLinkLogResult.rows;
    }

    res.json({
      message: "User fetched",
      error: false,
      user: userResult.rows[0],
      totalFolders: folderResult.rowCount,
      folders: folderResult.rows,
      totalFiles: fileResult.rowCount,
      files: fileResult.rows,
      totalTemplates: templateResult.rowCount,
      templates: templateResult.rows,
      totalBulkLinks: bulkLinkResult.rowCount,
      bulkLinks: bulkLinkResult.rows,
      totalAuditLogs: auditLogResult.rowCount,
      auditLogs: auditLogResult.rows,
    });
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      error: true,
      errormsg: err.message,
    });
  } finally {
    client.release();
  }
};
// Custom Logo
exports.customLogo = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.user_id;
    const custom_logo = req.body.custom_logo;
    const custom_logo_link = req.body.custom_logo_link;
    const logo_type = req.body.logo_type;
    const logo_name = req.body.logo_name;

    let query = "UPDATE users SET ";
    let index = 2;
    let values = [user_id];

    if (custom_logo) {
      query += `custom_logo = $${index} , `;
      values.push(custom_logo);
      index++;
    }
    if (custom_logo_link) {
      query += `custom_logo_link = $${index} , `;
      values.push(custom_logo_link);
      index++;
    }
    if (logo_type) {
      query += `logo_type = $${index} , `;
      values.push(logo_type);
      index++;
    }
    if (logo_name) {
      query += `logo_name = $${index} , `;
      values.push(logo_name);
      index++;
    }

    query += "WHERE user_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);

    // console.log(result)

    if (result.rows[0]) {
      res.json({
        message: "Custom Logo set Successfully",
        status: true,
        result: result.rows[0],
      });
    } else {
      res.json({
        message: "Record could not be updated",
        status: false,
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      status: false,
      error: err.message,
    });
  } finally {
    client.release();
  }
};
// Signatures
exports.customSignatures = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.user_id;
    const signature = req.body.signature;
    const initials = req.body.initials;

    let query = "UPDATE users SET ";
    let index = 2;
    let values = [user_id];

    if (signature) {
      query += `signature = $${index} , `;
      values.push(signature);
      index++;
    }
    if (initials) {
      query += `initials = $${index} , `;
      values.push(initials);
      index++;
    }

    query += "WHERE user_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);

    // console.log(result)

    if (result.rows[0]) {
      res.json({
        message: "Custom Signature set Successfully",
        status: true,
        result: result.rows[0],
      });
    } else {
      res.json({
        message: "Record could not be updated",
        status: false,
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      status: false,
      error: err.message,
    });
  } finally {
    client.release();
  }
};
exports.customSignaturesDelete = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.user_id;
    const signature = [];

    let query = "UPDATE users SET ";
    let index = 2;
    let values = [user_id];

    if (signature) {
      query += `signature = $${index} , `;
      values.push(signature);
      index++;
    }

    query += "WHERE user_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);

    // console.log(result)

    if (result.rows[0]) {
      res.json({
        message: "Custom Signature set Successfully",
        status: true,
        result: result.rows[0],
      });
    } else {
      res.json({
        message: "Record could not be updated",
        status: false,
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      status: false,
      error: err.message,
    });
  } finally {
    client.release();
  }
};
exports.customInitialsDelete = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.user_id;
    const initials = [];

    let query = "UPDATE users SET ";
    let index = 2;
    let values = [user_id];

    if (initials) {
      query += `initials = $${index} , `;
      values.push(initials);
      index++;
    }

    query += "WHERE user_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);

    // console.log(result)

    if (result.rows[0]) {
      res.json({
        message: "Custom Signature set Successfully",
        status: true,
        result: result.rows[0],
      });
    } else {
      res.json({
        message: "Record could not be updated",
        status: false,
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      status: false,
      error: err.message,
    });
  } finally {
    client.release();
  }
};
// Signature

// add signatures
exports.AddSignaturesToDb = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.user_id;
    const type = req.body.type;

    const signature_image_url = req.body.signature_image_url;
    const userData = await pool.query(
      "INSERT INTO user_signatures(signature_image_url, user_id,type) VALUES($1,$2,$3) returning *",
      [signature_image_url, user_id, type]
    );
    // const data = userData.rows[0]
    // console.log(data)
    if (userData.rows.length === 0) {
      console.log("data not exist");
      res.json({ error: false, message: "Could Not Add Signature !" });
    } else {
      res.json({ error: false, message: "Signature Added Successfully" });

      console.log("data exist");
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      status: false,
      error: err.message,
    });
  } finally {
    client.release();
  }
};
// get signatures
exports.GetSignaturesToDb = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.user_id;
    const type = req.body.type;

    let query;
    let values;

    if (type) {
      query = "SELECT * FROM user_signatures WHERE user_id = $1 AND type = $2";
      values = [user_id, type];
    } else {
      query = "SELECT * FROM user_signatures WHERE user_id = $1";
      values = [user_id];
    }

    const userData = await pool.query(query, values);

    if (userData.rows.length === 0) {
      res.json({ error: false, message: "No Signature Found", data: [] });
    } else {
      const data = userData.rows;
      res.json({ error: false, message: "Signature Found", data });
    }
  } catch (err) {
    res.json({ error: false, message: err });
  } finally {
    client.release();
  }
};
// delete signature from db by user_signature_id
exports.DeleteSignature = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_signature_id = req.body.user_signature_id;

    const userData = await pool.query(
      "DELETE FROM user_signatures WHERE user_signature_id = $1",
      [user_signature_id]
    );
    if (userData.rowCount === 0) {
      res.json({ error: true, message: "Could Not Delete Signature !" });
    } else {
      res.json({ error: false, message: "Signature Deleted Successfully" });
    }
  } catch (err) {
    res.json({ error: true, message: err });
  } finally {
    client.release();
  }
};
