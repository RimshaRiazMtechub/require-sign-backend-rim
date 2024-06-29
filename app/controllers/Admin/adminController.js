const { pool } = require("../../config/db.config");
const crypto = require("crypto");
var nodemailer = require("nodemailer");
const multer = require("multer");
const imageURL = require("../../EmailImage");
const ResetPasswordEmail = require("../../EmailUtils/reset_password_email");
const urls = require("../../urls");
const moment = require("moment");
const EmailVerifyOTP = require("../../EmailUtils/email_verify_otp");
// const upload = multer({ dest: "uploads/" });

exports.registerCustomer = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { user_name, email, password } = req.body;
    let imageFilePath = null; // Default value when no image is provided
    if (req.file) {
      imageFilePath = req.file.path;
    }
    const salt = "mySalt";
    const hashedPassword = crypto
      .createHash("sha256")
      .update(password + salt)
      .digest("hex");
    // console.log(hashedPassword);
    const userDataCheck = await pool.query(
      "SELECT * FROM admin WHERE email=$1",
      [email]
    );
    if (userDataCheck.rows.length === 0) {
      const userData = await pool.query(
        "INSERT INTO admin(email, user_name,image, password,status) VALUES($1,$2,$3,$4,$5) returning *",
        [email, user_name, imageFilePath, hashedPassword, "active"]
      );
      const data = userData.rows[0];
      res.json({ error: false, data, message: "Admin Added Successfully" });
    } else {
      const data = userDataCheck.rows[0];
      res.json({ error: true, data, message: "Admin Already Exist" });
    }
  } catch (err) {
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const salt = "mySalt";
    const userData = await pool.query(
      "SELECT * FROM admin WHERE email = $1 AND status=$2",
      [email, "active"]
    );
    if (userData.rows.length === 0) {
      res.json({ error: true, message: "Invalid Email or Inactive account" });
    } else {
      const Data = await pool.query("SELECT * FROM admin WHERE email = $1", [
        email,
      ]);
      const hashedPasswordFromDb = userData.rows[0].password;
      const hashedUserEnteredPassword = crypto
        .createHash("sha256")
        .update(password + salt)
        .digest("hex");

      if (hashedPasswordFromDb === hashedUserEnteredPassword) {
        res.json({
          error: false,
          data: Data.rows[0],
          message: "Login Successfully",
        });
      } else {
        res.json({ error: true, message: "Invalid Credentials" });
      }
    }
  } catch (err) {
    res.json({ error: true, message: err });
  }
};
exports.forgetPassword = async (req, res) => {
  try {
    const { email, location_country, ip_address, location_date, timezone } =
      req.body;
    const userData = await pool.query("SELECT * FROM admin WHERE email = $1", [
      email,
    ]);
    if (userData.rows.length === 0) {
      res.json({
        error: true,
        errorMsg: "NotExist",
        message: "Email Not Registered",
      });
    } else {
      // let user_id_log = userData.rows[0].user_id;
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
          `INSERT INTO verification(email,
            location_country,
          ip_address,
            location_date,
            timezone) VALUES($1,$2,$3,$4,$5) returning *`,
          [email, location_country, ip_address, location_date, timezone]
        );
      } else {
        const verify_idData = emailExist.rows[0].verify_id;
        verifyId = await pool.query(
          `UPDATE verification SET email=$1 , 
          location_country=$2,
ip_address=$3,
location_date=$4,
timezone=$5
 WHERE verify_id=$6 returning *`,
          [
            email,
            location_country,
            ip_address,
            location_date,
            timezone,
            verify_idData,
          ]
        );
      }

      if (verifyId.rows.length === 0) {
        res.json({ error: true, message: "Can't Verify Right Now" });
      } else {
        const data = verifyId.rows[0].verify_id;
        const message = `Please click the button below to update password for your account.`;
        const subject = `Update Password Request`;
        const first_name = userData.rows[0].user_name;
        const last_name = "";
        const resetLink = `${urls.password_update_admin_url}?token=${data}`;
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
    console.log(error);
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
      res.json({
        message: "VALID TOKEN",
        error: false,
        data: userData.rows[0],
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
exports.resentLinkForgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const userData = await pool.query("SELECT * FROM admin WHERE email = $1", [
      email,
    ]);
    if (userData.rows.length === 0) {
      res.json({ error: true, message: "Email Not Registered" });
    } else {
      const token = crypto.randomBytes(20).toString("hex");
      console.log(token);
      const verifyId = await pool.query(
        "SELECT * FROM verification WHERE email=$1",
        [email]
      );
      if (verifyId.rows.length === 0) {
        res.json({ error: true, message: "Can't Resend Link" });
      } else {
        // console.log(verifyId.rows[0])
        const data = verifyId.rows[0].verify_id;
        const btnText = "Update Password";
        const resetLink = `${urls.password_update_user_url}?token=${data}`;
        const first_name = "Admin";
        const last_name = "";
        const subject = `Update Password Request`;
        const message = `Please click the button below to update password for your account.`;
        Emailtemplate(
          email,
          resetLink,
          first_name,
          last_name,
          subject,
          message,
          btnText
        ); // Call the email sending function
        return res
          .status(200)
          .json({ message: "Resend Link sent successfully", error: false });
      }
    }
  } catch (error) {
    res.status(500).json(error);
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
    const message = `Enter the OTP provided below so you can update your password.`;
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

exports.updateProfile = async (req, res) => {
  const client = await pool.connect();
  try {
    const admin_id = req.body.admin_id;
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const contact_no = req.body.contact_no;
    const website_link = req.body.website_link;

    const image = req.body.image;
    console.log("admin_id");

    console.log(admin_id);

    let query = "UPDATE admin SET ";
    let index = 2;
    let values = [admin_id];

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

    if (image) {
      query += `image = $${index} , `;
      values.push(image);
      index++;
    }
    if (contact_no) {
      query += `contact_no = $${index} , `;
      values.push(contact_no);
      index++;
    }
    if (website_link) {
      query += `website_link = $${index} , `;
      values.push(website_link);
      index++;
    }

    query += "WHERE admin_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);

    if (result.rows[0]) {
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
      "SELECT * FROM admin WHERE email=$1",
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
          `UPDATE admin SET password=$1 WHERE email=$2 returning *`,
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
exports.emailResetLink = async (req, res) => {
  try {
    const { email } = req.body;
    const userData = await pool.query("SELECT * FROM admin WHERE email = $1", [
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
        subject: "Email Reset Request",
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
                          <img src="https://mtechub.org/mail/skins/elastic/images/logo.svg?s=1676897567" alt="Company Logo">
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
      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.error(error);
          // handle error response
          return res
            .status(500)
            .json({ error: true, message: "Failed to send Reset Link" });
        } else {
          const userDataCheck = await pool.query(
            "SELECT * FROM verify WHERE email=$1",
            [email]
          );
          // console.log(userDataCheck.rows)
          if (userDataCheck.rows.length === 0) {
            const data = await pool.query(
              "INSERT INTO verify(email, token) VALUES($1,$2) returning *",
              [email, token]
            );
            // console.log(data)
          } else {
            let query = "UPDATE verify SET ";
            let index = 2;
            let values = [email];

            if (token) {
              query += `token = $${index} , `;
              values.push(token);
              index++;
            }

            query += "WHERE email = $1 RETURNING*";
            query = query.replace(/,\s+WHERE/g, " WHERE");
            // console.log(query);
            const data = await pool.query(query, values);
          }
          console.log(`Email sent: ${info.response}`);
          // handle success response
          return res.status(200).json({
            error: false,
            message: "Reset Link sent successfully",
            token: token,
          });
        }
      });
    }
  } catch (error) {
    res.status(500).json(error);
  }
};
exports.EmailUpdate = async (req, res) => {
  const client = await pool.connect();
  try {
    const { password, token, newEmail } = req.body;
    const userDataCheck = await pool.query(
      "SELECT * FROM verify WHERE token=$1",
      [token]
    );
    if (userDataCheck.rows.length === 0) {
      res.json({ error: true, data: [], message: "Invalid Token" });
    } else {
      console.log(userDataCheck.rows[0].token);
      const EmailData = userDataCheck.rows[0].email;
      const salt = "mySalt";
      console.log(EmailData);
      const userData = await pool.query(
        "SELECT password FROM admin WHERE email = $1",
        [EmailData]
      );
      if (userData.rows.length === 0) {
        res.json({ error: true, message: "Invalid Email" });
      } else {
        const Data = await pool.query("SELECT * FROM admin WHERE email = $1", [
          EmailData,
        ]);
        const adminId = Data.rows[0].admin_id;
        const hashedPasswordFromDb = userData.rows[0].password;
        const hashedUserEnteredPassword = crypto
          .createHash("sha256")
          .update(password + salt)
          .digest("hex");

        if (hashedPasswordFromDb === hashedUserEnteredPassword) {
          const userData = await pool.query(
            `UPDATE admin SET email=$1 WHERE admin_id=$2 returning *`,
            [newEmail, adminId]
          );
          const data = userData.rows[0];
          res.json({
            error: false,
            data,
            message: "Email Updated Successfully",
          });
        } else {
          res.json({ error: true, message: "Invalid Password" });
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
// Bu Token
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
    // res.json(userDataCheck.rows)
    if (userDataCheck.rows.length === 0) {
      // const data=userDataCheck.rows[0]
      res.json({ error: true, data: [], message: "Token Expired" });
    } else {
      const email = userDataCheck.rows[0].email;
      const userData = await pool.query(
        `UPDATE admin SET password=$1 WHERE email=$2 returning *`,
        [hashedPassword, email]
      );
      // Expire code
      const checkQuery = "DELETE FROM verification WHERE verify_id = $1";
      const checkResult = await pool.query(checkQuery, [token]);
      const data = userData.rows[0];
      res.json({ error: false, data, message: "Updated Successfully" });
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
      "SELECT * FROM admin WHERE email=$1",
      [email]
    );
    // res.json(userDataCheck.rows)
    if (userDataCheck.rows.length === 0) {
      // const data=userDataCheck.rows[0]
      res.json({ error: true, data: [], message: "Email Doesnot Exist" });
    } else {
      const userData = await pool.query(
        `UPDATE admin SET password=$1 WHERE email=$2 returning *`,
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
      error: err.message,
    });
  } finally {
    client.release();
  }
};

exports.passwordUpdateSignedIn = async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, current_password, password } = req.body;
    const salt = "mySalt";
    const userData = await pool.query(
      "SELECT password FROM admin WHERE email = $1",
      [email]
    );
    if (userData.rows.length === 0) {
      res.json({ error: true, message: "Invalid Email" });
    } else {
      const hashedPasswordFromDb = userData.rows[0].password;
      console.log(hashedPasswordFromDb);

      const hashedUserEnteredPassword = crypto
        .createHash("sha256")
        .update(current_password + salt)
        .digest("hex");

      if (hashedPasswordFromDb === hashedUserEnteredPassword) {
        console.log(hashedPasswordFromDb);
        console.log(hashedUserEnteredPassword);

        // const hashedUserNewPassword = crypto.createHash('sha256').update(password + salt).digest('hex');

        //     const userData = await pool.query(`UPDATE admin SET password=$1 WHERE email=$2 returning *`,
        //     [hashedUserNewPassword, email]);
        // const data = userData.rows[0]
        // res.json({ error: true, data, message: "Updated Successfully" });
        // res.json({ error: false, data: Data.rows[0], message: "Login Successfully" });
      } else {
        // res.json({ error: true, message: "Invalid Credentials" });
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

exports.getAllCustomers = async (req, res) => {
  const client = await pool.connect();
  try {
    const query = "SELECT * FROM admin";
    const result = await pool.query(query);

    if (result.rows) {
      res.json({
        message: "All Users Fetched",
        status: true,
        result: result.rows,
      });
    } else {
      res.json({
        message: "could not fetch",
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

exports.getCustomerById = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.admin_id;
    console.log(user_id);
    if (!user_id) {
      return res.json({
        message: "Please provide admin_id",
        status: false,
      });
    }
    const query = "SELECT * FROM admin WHERE admin_id = $1";
    const result = await pool.query(query, [user_id]);

    if (result.rows[0]) {
      res.json({
        message: "Users fetched",
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
      status: false,
      error: err.message,
    });
  } finally {
    client.release();
  }
};
exports.changeStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const company_ids = req.body.admin_ids; // Array of company_ids
    const status = req.body.status;

    if (!Array.isArray(company_ids) || company_ids.length === 0) {
      return res.json({
        message: "Invalid admin_ids provided.",
        status: false,
      });
    }

    let query = "UPDATE admin SET ";
    let index = 1;
    let values = [];

    if (status) {
      query += `status = $${index}, `;
      values.push(status);
      index++;
    }

    query = query.slice(0, -2); // Remove the trailing comma and space after the last updated field.

    query += " WHERE admin_id IN (";

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
        message: "Admin Status has been Updated Successfully",
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
exports.deleteAdmin = async (req, res) => {
  const client = await pool.connect();
  try {
    const { admin_id } = req.body;

    // Perform the deletion query
    const deleteUserQuery = await pool.query(
      "DELETE FROM admin WHERE admin_id = $1",
      [admin_id]
    );

    // Check if any rows were deleted
    if (deleteUserQuery.rowCount === 1) {
      res.json({ error: false, message: "Admin Deleted Successfully" });
    } else {
      res.json({ error: true, message: "Cannot Delete Admin" });
    }
  } catch (err) {
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
exports.InviteAdmin = async (req, res) => {
  try {
    const { email, name } = req.body;
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
    const resetLink = `https://example.com/accept-invitation?token=${token}`;
    // generate random 6-digit OTP code
    // const otpCode = Math.floor(100000 + Math.random() * 900000);
    // define email message options
    const mailOptions = {
      from: "noreply@requiresign.com",
      to: email,
      subject: ` ${name} has been Invited to add as admin`,
      html: `
                  <html>
                    <head>
                      <style>
                        /* Define your CSS styles here */
                        body {
                          font-family: Arial, sans-serif;
                        }
                        .container {
                          background-color: #F4F4F4;
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
    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.error(error);
        // handle error response
        return res.status(500).json({ message: "Failed to send Invite Link" });
      } else {
        let imageFilePath = null; // Default value when no image is provided
        if (req.file) {
          imageFilePath = req.file.path;
        }
        const userData = await pool.query(
          "INSERT INTO admin(email,user_name,image,status) VALUES($1,$2,$3,$4) returning *",
          [email, name, imageFilePath, "pending"]
        );
        const data = userData.rows[0];
        if (userData.rows[0].length === 0) {
          res
            .status(500)
            .json({ error: true, message: "Unable to Send Email " });
        } else {
          console.log(`Email sent: ${info.response}`);
          // handle success response
          return res
            .status(200)
            .json({ error: false, message: "Invite Link sent successfully" });
        }
      }
    });
    // }
  } catch (error) {
    res.status(500).json(error);
  }
};
