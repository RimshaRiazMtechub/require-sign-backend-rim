const { pool } = require("../../config/db.config");
const crypto = require("crypto");
var nodemailer = require("nodemailer");

exports.registerDocuments = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { user_id, document_name, file_canvas } = req.body;

    // const hashedPassword = bcrypt.hashSync(password, 12)
    const salt = "mySalt";
    // console.log(hashedPassword);
    const userDataCheck = await pool.query(
      "SELECT * FROM users WHERE user_id=$1",
      [user_id]
    );
    if (userDataCheck.rows.length === 0) {
      res.json({ error: true, data, message: "User Doesn't Exist" });
    } else {
      const userData = await pool.query(
        "INSERT INTO documents(user_id, document_name,file_canvas) VALUES($1,$2,$3) returning *",
        [user_id, document_name, file_canvas]
      );
      const data = userData.rows[0];
      res.json({ error: false, data, message: "Document Added Successfully" });
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
      "SELECT password FROM users WHERE email = $1",
      [email]
    );
    if (userData.rows.length === 0) {
      res.json({ error: true, message: "No User exist for this email" });
    } else {
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
    }
  } catch (err) {
    res.json({ error: true, message: err });
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

      // Store the token in the temporary storage or database
      // Replace `passwordResetTokens` with your storage mechanism
      passwordResetTokens.set(token, email);
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
            .json({ message: "OTP code sent successfully", otp: resetLink });
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
    // const userData = await pool.query("SELECT * FROM Documentss WHERE email = $1", [email]);
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
    const Documents_id = req.body.Documents_id;
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const contact_no = req.body.contact_no;
    const company_name = req.body.company_name;
    const account_verified = req.body.account_verified;
    const referal_code = req.body.referal_code;

    let query = "UPDATE users SET ";
    let index = 2;
    let values = [Documents_id];

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

    query += "WHERE Documents_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);

    // console.log(result)

    if (result.rows[0]) {
      res.json({
        message: "Record Updated",
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

exports.getAllDocumentss = async (req, res) => {
  const client = await pool.connect();
  try {
    const query = "SELECT * FROM users";
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

exports.getDocumentsById = async (req, res) => {
  const client = await pool.connect();
  try {
    const Documents_id = req.body.user_id;

    if (!Documents_id) {
      return res.json({
        message: "Please provide Documents_id",
        status: false,
      });
    }
    const query = "SELECT * FROM users WHERE Documents_id = $1";
    const result = await pool.query(query, [Documents_id]);

    if (result.rows[0]) {
      res.json({
        message: "Users fetched",
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
// Custom Logo
exports.customLogo = async (req, res) => {
  const client = await pool.connect();
  try {
    const Documents_id = req.body.user_id;
    const custom_logo = req.body.custom_logo;
    const custom_logo_link = req.body.custom_logo_link;
    const logo_type = req.body.logo_type;
    const logo_name = req.body.logo_name;

    let query = "UPDATE users SET ";
    let index = 2;
    let values = [Documents_id];

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

    query += "WHERE Documents_id = $1 RETURNING*";
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
    const Documents_id = req.body.user_id;
    const signature = req.body.signature;
    const initials = req.body.initials;

    let query = "UPDATE users SET ";
    let index = 2;
    let values = [Documents_id];

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

    query += "WHERE Documents_id = $1 RETURNING*";
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
    const Documents_id = req.body.user_id;
    const signature = [];

    let query = "UPDATE users SET ";
    let index = 2;
    let values = [Documents_id];

    if (signature) {
      query += `signature = $${index} , `;
      values.push(signature);
      index++;
    }

    query += "WHERE Documents_id = $1 RETURNING*";
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
    const Documents_id = req.body.user_id;
    const initials = [];

    let query = "UPDATE users SET ";
    let index = 2;
    let values = [Documents_id];

    if (initials) {
      query += `initials = $${index} , `;
      values.push(initials);
      index++;
    }

    query += "WHERE Documents_id = $1 RETURNING*";
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
