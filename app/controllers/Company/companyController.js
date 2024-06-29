const { pool } = require("../../config/db.config");
const crypto = require("crypto");
var nodemailer = require("nodemailer");
const imageURL = require("../../EmailImage");
const Emailtemplate = require("../emailUtils");
const urls = require("../../urls");
const nodeScheduletoSendemailForPlan = require("../nodeScheduletoSendemailForPlanUtils");
const generateLicenseKey = require("../licenseKeyUtils");
const CompanyCreatedEmail = require("../../EmailUtils/company_created_email");
const InviteCompanyUser = require("../../EmailUtils/invite_company_user");

// gerate random password for new user
const generateRandomPassword = (length) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
};
exports.registerCompany = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      company_name,
      company_email,
      website_link,
      contact_no,
      address,
      company_admin_email,
      status,
      subdomain_name,
      primary_color,
      secondary_color,
      company_logo,
    } = req.body;

    const userDataCheck = await pool.query(
      "SELECT * FROM company WHERE company_email=$1",
      [company_email]
    );

    if (userDataCheck.rows.length === 0) {
      const userData = await pool.query(
        `INSERT INTO company(company_name,
                    company_email,
                    website_link,
                    company_logo,
                    contact_no,
                    address,
                    company_admin_email,
                    status) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
        [
          company_name,
          company_email,
          website_link,
          company_logo,
          contact_no,
          address,
          company_admin_email,
          status,
        ]
      );
      if (userData.rows.length === 0) {
        res.json({ error: true, data: [], message: "Error Creating Company" });
      } else {
        const current_token = new Date();
        // verification link expire after 1 minute
        const expirationTimestamp = new Date();
        expirationTimestamp.setMinutes(expirationTimestamp.getMinutes() + 1);
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
        // console.log(userDataCheck)

        const verifyId = await pool.query(
          "INSERT INTO verificationuseremail(email,expiry_token,current_token) VALUES($1,$2,$3) returning *",
          [
            company_email,
            expirationTimestamp.toISOString(),
            current_token.toISOString(),
          ]
        );
        if (verifyId.rows.length === 0) {
          res.json({ error: true, message: "something went wrong" });
        } else {
          const token = verifyId.rows[0].verify_id;
          const data = userData.rows[0];
          const message = `Delighted to have you for join us in exploring the endless possibilities of our RequireSign!`;
          const subject = `Welcome to RequireSign`;
          const resetLink = `${urls.email_verification_company_url}/${token}`;
          const first_name = company_name;
          const last_name = "";
          const btnText = "Verify Email Address";
          Emailtemplate(
            company_email,
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
          const user_id = userData.rows[0].company_id;
          const type = "FREE_TRAIL";
          const plan_name = "FREE TRAIL";

          const statusD = "Active";
          const planData = await pool.query(
            "INSERT INTO user_plan(plan_name, user_id,user_email,subscription_start_date, subscription_end_date , amount, comment,type,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *",
            [
              plan_name,
              user_id,
              company_email,
              subscription_start_date,
              subscription_end_date,
              amount,
              comment,
              type,
              statusD,
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
            let query = "UPDATE company SET ";
            let index = 2;
            let values = [company_email];

            if (activatedPlan) {
              query += `activatedPlan = $${index} , `;
              values.push(activatedPlan);
              index++;
            }
            query += "WHERE company_email = $1 RETURNING*";
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
              nodeScheduletoSendemailForPlan(
                "company",
                expirationTimestampPlan,
                company_email,
                activatedPlan,
                company_name,
                ""
              );
              return res.json({
                error: false,
                data,
                message: "Company Added Successfully",
              });
            }
          }
        }
      }
    } else {
      const data = userDataCheck.rows[0];
      res.json({ error: true, data, message: "Email Already Exist" });
    }
  } catch (err) {
    res.json({ error: true, data: [], message: err });
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

      if (
        userData.rows[0].expiry_token === null ||
        userData.rows[0].expiry_token === undefined
      ) {
        console.log("The token is still valid.");
        const is_verified = true;
        // Update Status  Account verified true
        let query = "UPDATE company SET ";
        let index = 2;
        let values = [email];

        if (is_verified) {
          query += `is_verified = $${index} , `;
          values.push(is_verified);
          index++;
        }
        query += "WHERE company_email = $1 RETURNING*";
        query = query.replace(/,\s+WHERE/g, " WHERE");
        // console.log(query);
        const result = await pool.query(query, values);
        // console.log(result)
        if (result.rows.length === 0) {
          res.json({
            message: "Record could not be updated",
            error: true,
          });
        } else {
          // send email
          // console.log(token)
          // console.log(token)
          const userDetail = await pool.query(
            "SELECT * FROM company WHERE company_email = $1",
            [email]
          );
          if (userDetail.rows[0].length === 0) {
            res.json({
              message: "Company Doesnot Exist",
              error: true,
            });
          } else {
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
          let query = "UPDATE company SET ";
          let index = 2;
          let values = [email];

          if (is_verified) {
            query += `is_verified = $${index} , `;
            values.push(is_verified);
            index++;
          }
          query += "WHERE company_email = $1 RETURNING*";
          query = query.replace(/,\s+WHERE/g, " WHERE");
          // console.log(query);
          const result = await pool.query(query, values);
          // console.log(result)
          if (result.rows[0]) {
            res.json({
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
exports.resendRegistrationLink = async (req, res) => {
  const client = await pool.connect();
  try {
    const email = req.body.email;
    const expiry_token = new Date();
    const current_token = new Date();

    expiry_token.setMinutes(expiry_token.getMinutes() + 1);
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
        "SELECT * FROM company WHERE company_email = $1",
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
        const resetLink = `${urls.email_verification_company_url}/${token}`;

        Emailtemplate(
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
exports.getCompanyUsers = async (req, res) => {
  const client = await pool.connect();
  try {
    const subdomain_name = req.body.subdomain_name;

    if (!subdomain_name) {
      return res.json({
        message: "Please provide Subdomain Name",
        error: true,
      });
    }
    const userDataCheck = await pool.query(
      "SELECT * FROM company WHERE subdomain_name=$1",
      [subdomain_name]
    );
    if (userDataCheck.rows.length === 0) {
      res.json({
        message: "Invalid subdomain name",
        error: true,
      });
    } else {
      const Company_id = userDataCheck.rows[0].company_id;
      const query = "SELECT * FROM users WHERE Company_id = $1";
      const result = await pool.query(query, [Company_id]);

      if (result.rows[0]) {
        res.json({
          message: "Company Users fetched",
          status: true,
          result: result.rows,
        });
      } else {
        res.json({
          message: "could not fetch",
          status: false,
        });
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
exports.getCompanyUserLogin = async (req, res) => {
  const client = await pool.connect();
  try {
    const subdomain_name = req.body.subdomain_name;
    const email = req.body.email;
    const password = req.body.password;
    const salt = "mySalt";

    if (!subdomain_name) {
      return res.json({
        message: "Please provide Subdomain Name",
        error: true,
      });
    }

    const userDataCheck = await pool.query(
      "SELECT * FROM company WHERE subdomain_name=$1",
      [subdomain_name]
    );
    if (userDataCheck.rows.length === 0) {
      res.json({
        message: "Invalid subdomain name",
        error: true,
      });
    } else {
      const Company_id = userDataCheck.rows[0].company_id;
      const query = "SELECT * FROM users WHERE Company_id = $1 AND email=$2";
      const result = await pool.query(query, [Company_id, email]);

      if (result.rows.length === 0) {
        res.json({
          message: "No user Exist for this email on this subdomain",
          error: true,
        });
      } else {
        if (
          result.rows[0].is_verified === true ||
          result.rows[0].is_verified === "true"
        ) {
          const hashedPasswordFromDb = result.rows[0].password;
          const hashedUserEnteredPassword = crypto
            .createHash("sha256")
            .update(password + salt)
            .digest("hex");

          if (hashedPasswordFromDb === hashedUserEnteredPassword) {
            res.json({
              error: false,
              data: result.rows[0],
              message: "Login Successfully",
              user_type: "company_user",
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
            errormsg: "inActive",
            message: "InActive Account",
          });
        }

        // res.json({
        //     message: "Company Users fetched",
        //     error: false,
        //     result: result.rows
        // })
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
// call for other
exports.getCompany = async (req, res) => {
  const client = await pool.connect();
  try {
    const company_id = req.body.company_id;
    if (!company_id) {
      return res.json({
        message: "Please provide Company Id",
        error: true,
      });
    }

    const userDataCheck = await pool.query(
      "SELECT * FROM company WHERE company_id=$1",
      [company_id]
    );
    const userDataCheck1 = await pool.query(
      "SELECT * FROM users WHERE company_id=$1 AND company_user=$2 ORDER BY user_id DESC",
      [company_id, true || "true"]
    );
    if (userDataCheck.rows.length === 0) {
      res.json({
        message: "No Data",
        error: false,
      });
    } else {
      res.json({
        error: false,
        data: userDataCheck.rows[0],
        company_users: userDataCheck1.rows,
        message: "Get Successfully",
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      error: true,
      errorMessage: err.message,
    });
  } finally {
    client.release();
  }
};
// delete user by user id from users table
// IN-PROGRESS DHHGDJDHDD USERS DELETE COMPANY ------------
exports.deleteCompanyUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const Company_id = req.body.company_id;

    const query = "SELECT * FROM users WHERE Company_id = $1";
    const result = await pool.query(query, [Company_id]);

    const deleteQuery = `
    DELETE FROM users
    WHERE user_id = $1 AND company_id = $2';
`;
    const res = await pool.query(deleteQuery, [user_id, company_id]);
    console.log("Records deleted successfully:", res.rowCount);

    if (result.rows[0]) {
      res.json({
        message: "Company Users fetched",
        status: true,
        result: result.rows,
      });
    } else {
      res.json({
        message: "could not fetch",
        status: false,
        result: [],
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

exports.getCompanyUsersById = async (req, res) => {
  const client = await pool.connect();
  try {
    const Company_id = req.body.company_id;

    const query = "SELECT * FROM users WHERE Company_id = $1";
    const result = await pool.query(query, [Company_id]);

    if (result.rows[0]) {
      res.json({
        message: "Company Users fetched",
        status: true,
        result: result.rows,
      });
    } else {
      res.json({
        message: "could not fetch",
        status: false,
        result: [],
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

exports.add_company_admin = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      company_name,
      company_email,
      website_link,
      contact_no,
      address,
      company_admin_email,
      status,
      subdomain_name,
      primary_color,
      secondary_color,
      company_logo,
    } = req.body;

    // Insert into company table
    const companyData = await client.query(
      "INSERT INTO company(company_name, company_email, contact_no, address, company_admin_email, status) VALUES($1, $2, $3, $4, $5, $6) RETURNING company_id",
      [
        company_name,
        company_email,
        contact_no,
        address,
        company_admin_email,
        status,
      ]
    );

    const companyId = companyData.rows[0].company_id;

    // Insert into website_links table
    for (let link of website_link) {
      await client.query(
        "INSERT INTO website_links(company_id, name, website_url) VALUES($1, $2, $3)",
        [companyId, link, link]
      );
    }

    // Insert into subdomain table
    await client.query(
      "INSERT INTO subdomain(name, company_id, primary_color, secondary_color, company_logo) VALUES($1, $2, $3, $4, $5)",
      [subdomain_name, companyId, primary_color, secondary_color, company_logo]
    );
    const first_name = company_name;
    const last_name = "";
    const subject = `Welcome to Our Service - Your Company Has Been Created!`;

    const resetLink = `${urls.password_create}/${companyId}`;

    CompanyCreatedEmail(
      company_admin_email,
      resetLink,
      first_name,
      last_name,
      subject,
      company_email,
      contact_no,
      address,
      subdomain_name
    );

    res.json({ error: false, message: "Company Created Successfully" });
    // send email
  } catch (err) {
    console.log(err);
    res.json({ error: true, message: "An error occurred" });
  } finally {
    client.release();
  }
};
// create password for the company
exports.create_password_company = async (req, res) => {
  const client = await pool.connect();
  try {
    const { company_id, password } = req.body;

    const salt = "mySalt";
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password + salt)
      .digest("hex");

    const userData = await pool.query(
      "UPDATE company SET password = $1, status = 'active' WHERE company_id = $2 RETURNING*",
      [hashedPassword, company_id]
    );
    if (userData.rows.length === 0) {
      res.json({ error: true, message: "Error creating password" });
    } else {
      res.json({ error: false, message: "Password created successfully" });
    }
  } catch (err) {
    console.log(err);
    res.json({ error: true, message: "An error occurred" });
  } finally {
    client.release();
  }
};

exports.add_company_user = async (req, res) => {
  const client = await pool.connect();
  try {
    const { company_id, email } = req.body;
    if (company_id === null || company_id === undefined || company_id === "") {
      res.json({ error: true, message: "Company Not getting" });
    } else {
      const CompanyDetail = await pool.query(
        "SELECT * FROM company WHERE company_id=$1",
        [company_id]
      );
      if (CompanyDetail.rows.length === 0) {
        res.json({ error: true, message: "Invalid Company id." });
      } else {
        const company_logo = CompanyDetail.rows[0].company_logo;
        const company_name = CompanyDetail.rows[0].company_name;
        let comp_id = CompanyDetail.rows[0].company_id;
        let comp_user = true;
        const UserExist = await pool.query(
          "SELECT * FROM users WHERE email=$1",
          [email]
        );
        if (UserExist.rows.length > 0) {
          res.json({ error: true, message: "User Already Exist" });
        } else {
          const is_verified = false;
          const is_active = true;
          const first_time_logged_in = false;
          const total_doc = 0;
          const total_bulk_links = 0;
          const disk_usage = 0;
          // <<<<<<<<<<<<<<<<<<<<check limit user >>>>>>>>>>>>>>

          const CompanyDetailAdmin = await pool.query(
            "SELECT * FROM users WHERE company_id=$1 AND company_admin=$2",
            [company_id, true || "true"]
          );
          if (CompanyDetailAdmin.rows.length > 0) {
            let admin_company_id = CompanyDetailAdmin.rows[0].user_id;
            const CompanyDetailAdminPlan = await pool.query(
              "SELECT * FROM user_plan WHERE user_id=$1 ",
              [admin_company_id]
            );
            if (CompanyDetailAdminPlan.rows.length > 0) {
              const members_allowed = CompanyDetailAdminPlan.rows[0].members;
              const CompanyDetailUsers = await pool.query(
                "SELECT COUNT(*) FROM users WHERE company_id=$1 AND company_user=$2",
                [company_id, true || "true"]
              );
              console.log(CompanyDetailUsers.rows[0].count);
              console.log(members_allowed);
              if (CompanyDetailUsers.rows[0].count < members_allowed) {
                // res.json({ error: false, message: " Limit Remaining" });
                // ------------------------------

                // limit remaining >>>>>

                // --------------------------------
                const userData = await pool.query(
                  "INSERT INTO users(email, company_id, company_user,is_verified,is_active,first_time_logged_in) VALUES($1, $2, $3,$4,$5,$6) RETURNING*",
                  [
                    email,
                    comp_id,
                    comp_user,
                    is_verified,
                    is_active,
                    first_time_logged_in,
                  ]
                );
                if (userData.rows.length === 0) {
                  res.json({ error: true, message: "Error Inviting User" });
                } else {
                  // email sent
                  const current_token = new Date();
                  // verification link expire after 1 minute
                  const expirationTimestamp = new Date();
                  // expirationTimestamp.setMinutes(expirationTimestamp.getMinutes() + 1);
                  // for 24 hours
                  expirationTimestamp.setDate(
                    expirationTimestamp.getDate() + 1
                  );
                  expirationTimestamp.setHours(0, 0, 0, 0); // Set to midnight of tomorrow
                  console.log(expirationTimestamp);
                  // Free trail expiration after 14 days
                  const expirationTimestampPlan = new Date();
                  // 5 minutes for testing
                  expirationTimestampPlan.setMinutes(
                    expirationTimestampPlan.getMinutes() + 5
                  );
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
                    const token = verifyId.rows[0].verify_id;
                    const subject = `Welcome to ${company_name}!`;
                    const resetLink = `${urls.email_verification_url}/${token}?company_id=${company_id}`;
                    // Email Verification
                    // sendVerificationEmail(email, token, first_name, last_name, subject, message); // Call the email sending function
                    InviteCompanyUser(email, resetLink, company_name, subject);
                    res.json({
                      error: false,
                      message: "User Invited Successfully",
                    });
                  }
                }
                // remaing limit >>>>
              } else {
                res.json({
                  error: true,
                  userlimit: true,
                  message: "User Limit Exceed",
                });
              }
            } else {
              res.json({
                error: true,
                message: "Company Admin Plan Not Found",
              });
            }

            // if(CompanyDetail.rows[0].total_user>CompanyDetail.rows[0].total_user_limit){
            //   res.json({ error: true, message: "User Limit Exceed" });
          } else {
            res.json({ error: true, message: "Company Admin Not Found" });
          }
          // end
          // Insert new user into users table with that email and company id and company user true
          // const userData = await pool.query(
          //   "INSERT INTO users(email, company_id, company_user,is_verified,is_active,first_time_logged_in) VALUES($1, $2, $3,$4,$5,$6) RETURNING*",
          //   [email, comp_id, comp_user,is_verified,is_active,first_time_logged_in]
          // );
          // if (userData.rows.length === 0) {
          //   res.json({ error: true, message: "Error Inviting User" });
          // } else {
          //   // email sent
          //   const subject = `Welcome to ${company_name}!`;
          //   const message = `Please2 click the button below to verify your email address to activate your account.`;
          //   const btnText = `Verify`;
          //   const resetLink = `${urls.email_verification_url}/${token}`;
          //   // Email Verification
          //   // sendVerificationEmail(email, token, first_name, last_name, subject, message); // Call the email sending function
          //   WelcomeEmailVerify(
          //     email,
          //     resetLink,
          //     company_name,
          //     subject,
          //     message,
          //     btnText
          //   );

          //   res.json({ error: false, message: "User Invited Successfully" });
          // }
        }
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
exports.add_company_user1 = async (req, res) => {
  const client = await pool.connect();
  try {
    const { company_id, email } = req.body;
    if (company_id === null || company_id === undefined || company_id === "") {
      res.json({ error: true, message: "Company Not getting" });
    } else {
      const CompanyDetail = await pool.query(
        "SELECT * FROM company WHERE company_id=$1",
        [company_id]
      );
      if (CompanyDetail.rows.length === 0) {
        res.json({ error: true, message: "Invalid Company id." });
      } else {
        const company_logo = CompanyDetail.rows[0].company_logo;
        const company_name = CompanyDetail.rows[0].company_name;
        let comp_id = CompanyDetail.rows[0].company_id;
        let comp_user = true;
        const UserExist = await pool.query(
          "SELECT * FROM users WHERE email=$1",
          [email]
        );
        if (UserExist.rows.length > 0) {
          res.json({ error: true, message: "User Already Exist" });
        } else {
          const is_verified = false;
          const is_active = true;
          const first_time_logged_in = false;
          const total_doc = 0;
          const total_bulk_links = 0;
          const disk_usage = 0;
          // <<<<<<<<<<<<<<<<<<<<check limit user >>>>>>>>>>>>>>

          const CompanyDetailAdmin = await pool.query(
            "SELECT * FROM users WHERE company_id=$1 AND company_admin=$2",
            [company_id, true || "true"]
          );
          if (CompanyDetailAdmin.rows.length > 0) {
            let admin_company_id = CompanyDetailAdmin.rows[0].user_id;
            const CompanyDetailAdminPlan = await pool.query(
              "SELECT * FROM user_plan WHERE user_id=$1 ",
              [admin_company_id]
            );
            if (CompanyDetailAdminPlan.rows.length > 0) {
              // update user plan members add 1
              const planMembers = CompanyDetailAdminPlan.rows[0].members;
              const planId = CompanyDetailAdminPlan.rows[0].plan_id;
              const type = CompanyDetailAdminPlan.rows[0].type;
              const result = parseInt(planMembers) + parseInt(1);
              // get plan pricing original
              let priceOriginal;
              const PricingPlan = await pool.query(
                "SELECT * FROM pricing WHERE pricing_id=$1 ",
                [planId]
              );
              if (type === "monthly") {
                priceOriginal = PricingPlan.rows[0].monthly_price;
              } else {
                priceOriginal = PricingPlan.rows[0].yearly_price;
              }
              console.log(result);
              console.log(result);
              let PriceNow = parseInt(priceOriginal) * parseInt(result);

              const CompanyDetailAdminPlanUpdate = await pool.query(
                "UPDATE user_plan SET members=$1 ,amount=$3  WHERE user_id=$2 RETURNING*",
                [result, admin_company_id, PriceNow]
              );
              const members_allowed = CompanyDetailAdminPlan.rows[0].members;
              const CompanyDetailUsers = await pool.query(
                "SELECT COUNT(*) FROM users WHERE company_id=$1 AND company_user=$2",
                [company_id, true || "true"]
              );
              console.log(CompanyDetailUsers.rows[0].count);
              console.log(members_allowed);

              // if (CompanyDetailUsers.rows[0].count < members_allowed) {
              // res.json({ error: false, message: " Limit Remaining" });
              // ------------------------------

              // limit remaining >>>>>

              // --------------------------------
              const userData = await pool.query(
                "INSERT INTO users(email, company_id, company_user,is_verified,is_active,first_time_logged_in) VALUES($1, $2, $3,$4,$5,$6) RETURNING*",
                [
                  email,
                  comp_id,
                  comp_user,
                  is_verified,
                  is_active,
                  first_time_logged_in,
                ]
              );
              if (userData.rows.length === 0) {
                res.json({ error: true, message: "Error Inviting User" });
              } else {
                // email sent
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
                  const token = verifyId.rows[0].verify_id;
                  const subject = `Welcome to ${company_name}!`;
                  const resetLink = `${urls.email_verification_url}/${token}?company_id=${company_id}`;
                  // Email Verification
                  // sendVerificationEmail(email, token, first_name, last_name, subject, message); // Call the email sending function
                  InviteCompanyUser(email, resetLink, company_name, subject);
                  res.json({
                    error: false,
                    message: "User Invited Successfully",
                  });
                }
              }
              // remaing limit >>>>
              // } else {
              //   res.json({ error: true,userlimit:true, message: "User Limit Exceed" });
              // }
            } else {
              res.json({
                error: true,
                message: "Company Admin Plan Not Found",
              });
            }

            // if(CompanyDetail.rows[0].total_user>CompanyDetail.rows[0].total_user_limit){
            //   res.json({ error: true, message: "User Limit Exceed" });
          } else {
            res.json({ error: true, message: "Company Admin Not Found" });
          }
          // end
          // Insert new user into users table with that email and company id and company user true
          // const userData = await pool.query(
          //   "INSERT INTO users(email, company_id, company_user,is_verified,is_active,first_time_logged_in) VALUES($1, $2, $3,$4,$5,$6) RETURNING*",
          //   [email, comp_id, comp_user,is_verified,is_active,first_time_logged_in]
          // );
          // if (userData.rows.length === 0) {
          //   res.json({ error: true, message: "Error Inviting User" });
          // } else {
          //   // email sent
          //   const subject = `Welcome to ${company_name}!`;
          //   const message = `Please2 click the button below to verify your email address to activate your account.`;
          //   const btnText = `Verify`;
          //   const resetLink = `${urls.email_verification_url}/${token}`;
          //   // Email Verification
          //   // sendVerificationEmail(email, token, first_name, last_name, subject, message); // Call the email sending function
          //   WelcomeEmailVerify(
          //     email,
          //     resetLink,
          //     company_name,
          //     subject,
          //     message,
          //     btnText
          //   );

          //   res.json({ error: false, message: "User Invited Successfully" });
          // }
        }
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
exports.login = async (req, res) => {
  try {
    const { email, password, company_user } = req.body;
    const salt = "mySalt";
    const userData = await pool.query(
      "SELECT password FROM users WHERE email = $1 AND company_user=$2",
      [email, company_user]
    );
    if (userData.rows.length === 0) {
      res.json({ error: true, message: "No User exist for this email" });
    } else {
      if (userData.rows[0].is_verified) {
        const hashedPasswordFromDb = userData.rows[0].password;
        const hashedUserEnteredPassword = crypto
          .createHash("sha256")
          .update(password + salt)
          .digest("hex");

        if (hashedPasswordFromDb === hashedUserEnteredPassword) {
          res.json({ error: false, message: "Login Successfully" });
        } else {
          res.json({ error: true, message: "Invalid Credentials" });
        }
      } else {
        res.json({ error: true, message: "Account Inactive" });
      }
    }
  } catch (err) {
    res.json({ error: true, message: err });
  }
};
exports.InviteUser = async (req, res) => {
  try {
    const { email, company_id, company_name } = req.body;
    // const userData = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    // if (userData.rows.length === 0) {
    //     res.json({ error: true, message: "Email Not Registered" });
    // } else {
    const token = crypto.randomBytes(20).toString("hex");
    console.log(token);

    // Store the token in the temporary storage or database
    // Replace `passwordResetTokens` with your storage mechanism
    // passwordResetTokens.set(token, email);
    // create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "rimshanimo22@gmail.com",
        pass: "tvjdtjvfbwuwseft",
      },
    });
    // Define the password reset link
    const resetLink = `https://example.com/create-password?token=${token}`;
    // generate random 6-digit OTP code
    // const otpCode = Math.floor(100000 + Math.random() * 900000);

    // define email message options
    const mailOptions = {
      from: "noreply@requiresign.com",
      to: email,
      subject: `Company ${company_name} Invite Link Request`,
      html: `
                  <html>
                    <head>
                      <style>
                        /* Define your CSS styles here */
                        body {
                            font-family: Arial, sans-serif;
                        }
                
                        .main_container {
                            display: flex;
                            flex-direction: row;
                        }
                
                        .empty_container {
                            width: 30%
                        }
                
                        .card_container {
                            width: 40%;
                            border: 1px solid #ddd7d7
                        }
                
                        .container {
                
                            padding: 20px;
                            border-radius: 5px;
                        }
                
                        .logo {
                            justify-content: center;
                            width: 100px;
                            height: 100px;
                        }
                
                        .otp-code {
                            font-size: 20px;
                            /* font-weight: bold; */
                            text-align: left;
                            line-height: 30px;
                
                
                        }
                
                        .paragraph {
                            line-height: 20px;
                        }
                
                        .instructions {
                            background-color: #ebe7e7;
                            padding-bottom: 10px;
                            padding: 20px;
                
                        }
                
                        .instructions_header {
                            font-size: 20px;
                            font-weight: bold;
                            line-height: 30px;
                
                        }
                
                        .instructions_Grid {
                            display: flex;
                            flex-direction: row;
                            justify-content: space-between;
                
                        }
                
                        .sub {
                            display: flex;
                            flex-direction: column;
                            line-height: 27px;
                            width: 50%;
                        }
                
                        .footer {
                            text-align: center;
                            margin-top: 30px;
                            margin-bottom: 30px;
                            font-size: 12px;
                            color: #888888;
                        }
                
                        .Bold_text {
                            font-weight: bold;
                        }
                
                        .link {
                            text-decoration: none;
                        }
                
                        .instructions_Button {
                            display: flex;
                            justify-content: center;
                            margin-top: 20px;
                            margin-bottom: 10px;
                
                        }
                
                        .button {
                            height: 40px;
                            width: 200px;
                            background-color: green;
                            color: white;
                            border:none
                        }
                        .button:hover{
                            cursor: pointer;
                            background-color: white;
                            color: green;
                            border: 1px solid green;
                
                        }
                      </style>
                    </head>
                    <body>
                    <div class="main_container">
                    <div class="empty_container">
            
                    </div>
                    <div class="card_container">
            
                        <div class="container">
                            <div class="logo">
                                <img src="https://mtechub.org/mail/skins/elastic/images/logo.svg?s=1676897567" alt="Company Logo">
                            </div>
                            <div class="otp-code">
                                Welcome <span class="Bold_text">Company name</span>
            
                            </div>
            
                            <p class="paragraph">
                                Thank you for registering your company with mtechub
                            </p>
                        </div>
                        <div class="instructions">
                            <div class="instructions_header">
                                Company Details :
                            </div>
                            <div class="instructions_Grid">
                                <div class="sub">
                                    Company Name :<br>
                                    Email :<br>
                                    Subdomain Name :<br>
                                    Subscription Start Date :<br>
                                    Subscription End Date :<br>
                                    Company Admin Email :<br>
                                    Company Status :<br>
            
            
            
                                </div>
                                <div class="sub">
                                    <b>health hero</b>
                                    <a href="url" class="link">healthhero.info@gmail.com</a>
                                    healthhero<br>
                                    07-05-2023 <br>
                                    07-06-2023 <br>
                                    healthhero.info@gmail.com <br>
                                    Active <br>
            
            
                                </div>
                            </div>
                            <div class="instructions_Button">
                                <button type="button" class="button">Click here to Login</button>
                            </div>
                        </div>
                        <div class="footer">
                            This email was sent by RequireSign. &copy; 2023 All rights reserved.
                        </div>
                    </div>
                    <div class="empty_container">
            
                    </div>
            
                </div>
                    </body>
                  </html>`,
    };

    // send email message
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        // handle error response
        return res.status(500).json({ message: "Failed to send Invite Link" });
      } else {
        console.log(`Email sent: ${info.response}`);
        // handle success response
        return res
          .status(200)
          .json({ message: "Invite Link sent successfully" });
      }
    });
    // }
  } catch (error) {
    res.status(500).json(error);
  }
};
exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const userData = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userData.rows.length === 0) {
      res.json({ error: true, message: "Email Not Registered" });
    } else {
      const token = crypto.randomBytes(20).toString("hex");
      console.log(token);

      // Store the token in the temporary storage or database
      // Replace `passwordResetTokens` with your storage mechanism
      // passwordResetTokens.set(token, email);
      // create nodemailer transporter
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: "rimshanimo22@gmail.com",
          pass: "tvjdtjvfbwuwseft",
        },
      });
      // Define the password reset link
      const resetLink = `https://example.com/reset-password?token=${token}`;
      // generate random 6-digit OTP code
      // const otpCode = Math.floor(100000 + Math.random() * 900000);

      // define email message options
      const mailOptions = {
        from: "noreply@requiresign.com",
        to: email,
        subject: "Password Reset Request",
        html: `
                  <html>
                    <head>
                      <style>
                        /* Define your CSS styles here */
                        body {
                          font-family: Arial, sans-serif;
                        }
                        .container {
                          background-color: #f4f4f4;
                          padding: 20px;
                          border-radius: 5px;
                        }
                        .logo {
                          text-align: center;
                          margin-bottom: 20px;
                        }
                        .reset-link {
                          font-size: 16px;
                          text-align: center;
                          margin-bottom: 30px;
                        }
                        .instructions {
                          margin-bottom: 10px;
                        }
                        .footer {
                          text-align: center;
                          margin-top: 30px;
                          font-size: 12px;
                          color: #888888;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <div class="logo">
                          <img src="https://example.com/logo.png" alt="Company Logo">
                        </div>
                        <div class="reset-link">
                          Please click the following link to reset your password:
                          <br>
                          <a href="${resetLink}">${resetLink}</a>
                        </div>
                        <div class="instructions">
                          If you did not request a password reset, please ignore this email.
                        </div>
                      </div>
                      <div class="footer">
                        This email was sent by Company Name. &copy; 2023 All rights reserved.
                      </div>
                    </body>
                  </html>`,
      };

      // send email message
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
          // handle error response
          return res.status(500).json({ message: "Failed to send OTP code" });
        } else {
          console.log(`Email sent: ${info.response}`);
          // handle success response
          return res
            .status(200)
            .json({ message: "Reset Link sent successfully" });
        }
      });
    }
  } catch (error) {
    res.status(500).json(error);
  }
};
exports.emailverification = async (req, res) => {
  try {
    const { email } = req.body;
    // const userData = await pool.query("SELECT * FROM Companys WHERE email = $1", [email]);
    // if (userData.rows.length === 0) {
    //     res.json({ error: true, message: "Email Not Registered" });
    // } else {
    // create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "rimshanimo22@gmail.com",
        pass: "tvjdtjvfbwuwseft",
      },
    });

    // generate random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000);

    // define email message options
    const mailOptions = {
      from: "noreply@requiresign.com",
      to: email,
      subject: "Your OTP code for verification",
      html: `
                <html>
            <head>
                <style>
                    /* Define your CSS styles here */
                    body {
                        font-family: Arial, sans-serif;
                    }
                    .container {
                        background-color: #f4f4f4;
                        padding: 20px;
                        border-radius: 5px;
                    }
                    .logo {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .otp-code {
                        font-size: 24px;
                        font-weight: bold;
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .instructions {
                        margin-bottom: 10px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        font-size: 12px;
                        color: #888888;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">
                        <img src="https://mtechub.org/mail/skins/elastic/images/logo.svg?s=1676897567" alt="Company Logo">
                    </div>
                    <div class="otp-code">
                        Your OTP code is: ${otpCode}
                    </div>
                    <div class="instructions">
                        Please enter this code to verify your account.
                    </div>
                </div>
                <div class="footer">
                    This email was sent by RequireSign. &copy; 2023 All rights reserved.
                </div>
            </body>
        </html>`,
      // text: `Your OTP code is ${otpCode}. Please enter this code to verify your account.`
    };
    // send email message
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        // handle error response
        return res.status(500).json({ message: "Failed to send OTP code" });
      } else {
        console.log(`Email sent: ${info.response}`);
        // handle success response
        return res
          .status(200)
          .json({ message: "OTP code sent successfully", otp: otpCode });
      }
    });
    // }
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.updateProfile = async (req, res) => {
  const client = await pool.connect();
  try {
    const company_id = req.body.company_id;
    const company_name = req.body.company_name;
    const company_email = req.body.company_email;
    const contact_no = req.body.contact_no;
    const address = req.body.address;
    const company_admin_email = req.body.company_admin_email;
    const status = req.body.status;
    const website_link = req.body.website_link;
    const subdomain_name = req.body.subdomain_name;
    const primary_color = req.body.primary_color;
    const secondary_color = req.body.secondary_color;
    const company_logo = req.body.company_logo;

    console.log(company_id);
    let query = "UPDATE company SET ";
    let index = 2;
    let values = [company_id];

    if (company_name) {
      query += `company_name = $${index} , `;
      values.push(company_name);
      index++;
    }
    if (company_email) {
      query += `company_email = $${index} , `;
      values.push(company_email);
      index++;
    }
    if (contact_no) {
      query += `contact_no = $${index} , `;
      values.push(contact_no);
      index++;
    }
    if (address) {
      query += `address = $${index} , `;
      values.push(address);
      index++;
    }
    if (company_admin_email) {
      query += `company_admin_email = $${index} , `;
      values.push(company_admin_email);
      index++;
    }
    if (website_link) {
      query += `website_link = $${index} , `;
      values.push(website_link);
      index++;
    }
    if (subdomain_name) {
      query += `subdomain_name = $${index} , `;
      values.push(subdomain_name);
      index++;
    }
    if (primary_color) {
      query += `primary_color = $${index} , `;
      values.push(primary_color);
      index++;
    }
    if (secondary_color) {
      query += `secondary_color = $${index} , `;
      values.push(secondary_color);
      index++;
    }
    if (company_logo) {
      query += `company_logo = $${index} , `;
      values.push(company_logo);
      index++;
    }
    if (status) {
      query += `status = $${index} , `;
      values.push(status);
      index++;
    }
    query += "WHERE company_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);

    console.log(result.rows);

    if (result.rows) {
      res.json({
        message: "Company Profile Updated Successfully",
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
      errorMessage: err.message,
    });
  } finally {
    client.release();
  }
};
exports.updateCompanySubdomain = async (req, res) => {
  const client = await pool.connect();
  try {
    const company_id = req.body.company_id;

    const subdomain_name = req.body.subdomain_name;
    const primary_color = req.body.primary_color;
    const secondary_color = req.body.secondary_color;
    const company_logo = req.body.company_logo;

    let query = "UPDATE subdomain SET ";
    let index = 2;
    let values = [company_id];

    if (subdomain_name) {
      query += `name = $${index} , `;
      values.push(subdomain_name);
      index++;
    }
    if (primary_color) {
      query += `primary_color = $${index} , `;
      values.push(primary_color);
      index++;
    }
    if (secondary_color) {
      query += `secondary_color = $${index} , `;
      values.push(secondary_color);
      index++;
    }
    if (company_logo) {
      query += `company_logo = $${index} , `;
      values.push(company_logo);
      index++;
    }

    query += "WHERE company_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);

    console.log(result.rows[0]);

    if (result.rows[0]) {
      res.json({
        message: "Company subdomain Updated Successfully",
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
exports.updateStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const company_id = req.body.company_id;
    const status = req.body.status;

    let query = "UPDATE company SET ";
    let index = 2;
    let values = [company_id];

    if (status) {
      query += `status = $${index} , `;
      values.push(status);
      index++;
    }

    query += "WHERE company_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);

    // console.log(result)

    if (result.rows[0]) {
      res.json({
        message: "Company Status has been Updated Successfully",
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
exports.updateMultipleStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const company_ids = req.body.company_ids; // Array of company_ids
    const status = req.body.status;

    if (!Array.isArray(company_ids) || company_ids.length === 0) {
      return res.json({
        message: "Invalid company_ids provided.",
        status: false,
      });
    }

    let query = "UPDATE company SET ";
    let index = 1;
    let values = [];

    if (status) {
      query += `status = $${index}, `;
      values.push(status);
      index++;
    }

    query = query.slice(0, -2); // Remove the trailing comma and space after the last updated field.

    query += " WHERE company_id IN (";

    for (const company_id of company_ids) {
      query += `$${index},`;
      values.push(company_id);
      index++;
    }

    // Remove the trailing comma and close the IN clause.
    query = query.slice(0, -1) + ") RETURNING *";

    const result = await pool.query(query, values);

    if (result.rows.length > 0) {
      res.json({
        message: "Company Status has been Updated Successfully",
        status: true,
        result: result.rows,
      });
    } else {
      res.json({
        message: "No records updated",
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
      const userData = await pool.query(
        `UPDATE users SET password=$1 WHERE email=$2 returning *`,
        [hashedPassword, email]
      );
      const data = userData.rows[0];
      res.json({ error: true, data, message: "Updated Successfully" });
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
exports.getAllCompanys = async (req, res) => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        company.*, 
        json_agg(DISTINCT website_links) as website_links, 
        json_agg(DISTINCT subdomain) as subdomains
      FROM company
      LEFT JOIN website_links ON company.company_id = website_links.company_id::INTEGER
      LEFT JOIN subdomain ON company.company_id = subdomain.company_id::INTEGER
      GROUP BY company.company_id
    `;
    const result = await pool.query(query);
    if (result.rows) {
      res.json({
        message: "All Companies Fetched",
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
    });
  } finally {
    client.release();
  }
};

exports.getCompanyById = async (req, res) => {
  const client = await pool.connect();
  try {
    const Company_id = req.body.company_id;
    console.log(Company_id);

    // if (!Company_id) {
    //   return res.json({
    //     message: "Please provide Company_id",
    //     error: true,
    //   });
    // }
    const query = `  SELECT 
    company.*, 
    json_agg(DISTINCT website_links) as website_links, 
    json_agg(DISTINCT subdomain) as subdomains
  FROM company
  LEFT JOIN website_links ON company.company_id = website_links.company_id::INTEGER
  LEFT JOIN subdomain ON company.company_id = subdomain.company_id::INTEGER
  WHERE company.company_id = $1
  GROUP BY company.company_id`;
    const result = await pool.query(query, [Company_id]);

    if (result.rows[0]) {
      res.json({
        message: "Company fetched",
        error: false,
        result: result.rows,
      });
    } else {
      res.json({
        message: "could not fetch",
        error: false,
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
exports.deleteCompany = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const company_id = req.body.company_id;

    // Delete website links
    const deleteWebsiteLinksQuery =
      "DELETE FROM website_links WHERE company_id = $1";
    await client.query(deleteWebsiteLinksQuery, [company_id]);

    // Delete subdomain
    const deleteSubdomainQuery = "DELETE FROM subdomain WHERE company_id = $1";
    await client.query(deleteSubdomainQuery, [company_id]);

    // Delete company
    const deleteCompanyQuery = "DELETE FROM company WHERE company_id = $1";
    await client.query(deleteCompanyQuery, [company_id]);

    await client.query("COMMIT");

    res.json({
      message: "Company, its Website Links and Subdomain Deleted Successfully",
      status: true,
    });
  } catch (err) {
    await client.query("ROLLBACK");
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
