const SendEsignEmailTemplate = require("../../EmailUtils/send_to_esign_email_template");
const { pool } = require("../../config/db.config");
const urls = require("../../urls");
const decryptData = require("../../utils/decrypt");
const encryptData = require("../../utils/encrypt");
const { v4: uuidv4 } = require("uuid");

exports.addTemplates = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      user_id,
      file_name,
      file_url,
      email,
      location_country,
      ip_address,
      location_date,
      timezone,
    } = req.body;

    const userDataCheck = await pool.query(
      "SELECT * FROM users WHERE user_id=$1",
      [user_id]
    );
    if (userDataCheck.rows.length === 0) {
      res.json({ error: true, data: [], message: "User Doesnot Exist" });
    } else {
      console.log("User Exist");
      let url = uuidv4();

      const userData = await pool.query(
        "INSERT INTO template(user_id,file_name,uniq_id,status,url,file_url,is_deleted,is_trash_deleted) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *",
        [user_id, file_name, uuidv4(), "active", url, file_url,false,false]
      );
      // const data = userData.rows[0]
      if (userData.rows.length === 0) {
        res.json({ error: true, data: [], message: "Can't Save file" });
      } else {
        // Log Maintain
        //  audit log FILE
        const event_type_file = "TEMPLATE-CREATED";
        let description = `${email} created template ${file_name} `;
        const template_id = userData.rows[0].template_id;
        const file_audit_result = await pool.query(
          "INSERT INTO template_log(template_id,description,email,event,location_country,ip_address,location_date,timezone) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *",
          [
            template_id,
            description,
            email,
            event_type_file,
            location_country,
            ip_address,
            location_date,
            timezone,
          ]
        );
        if (file_audit_result.rows.length === 0) {
          console.log("FILE LOG MAINTAIN ERROR SIGN IN");
        } else {
          console.log("FILE SUCCESS LOG SIGN IN ");
        }
        // end audit log FILE
        console.log(userData.rows[0].template_id);

        res.json({
          error: false,
          data: userData.rows[0],
          message: "Template Added Successfully",
        });
      }

      // Generate a unique ID using the uuid module
    }
  } catch (err) {
    console.log(err);
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
exports.shareTemplates = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      url_hashed,
      email,
      message,
      subject,
      user_id,
      template_id,
      title,
      email_user,
      location_country,
      ip_address,
      location_date,
      user_name_sender,
      timezone,
    } = req.body;
// Check if the user has a company ID
let company_logo=null
const userCompanyData = await pool.query(
  "SELECT company_id FROM users WHERE user_id = $1",
  [user_id]
);
if (userCompanyData.rows.length === 0 || !userCompanyData.rows[0].company_id) {
  // User does not have a company ID
  return res.json({
    error: true,
    data: [],
    message: "User does not have a company ID.",
  });
}else{
  const company_id = userCompanyData.rows[0].company_id;
   // Get the company details
   const companyData = await pool.query(
    "SELECT * FROM company WHERE company_id = $1",
    [company_id]
  );

  if (companyData.rows.length === 0) {
    // Company does not exist
  
  }else{
     company_logo = companyData.rows[0].company_logo
    //  company_primary_color = companyData.rows[0].primary_color
    //  company_name = companyData.rows[0].company_name


  }
}
    // Check if the combination of email and template ID already exists
    const existingData = await pool.query(
      "SELECT * FROM template_responses WHERE email = $1 AND template_id = $2",
      [email, template_id]
    );

    if (existingData.rows.length > 0) {
      // Combination of email and template ID already exists
      return res.json({
        error: true,
        data: [],
        message: "Template already shared to this email.",
      });
    }
    console.log(url_hashed);
    let hashedUrl = encryptData(url_hashed);
    console.log(email);
    console.log(message);
    console.log(subject);
    const userData = await pool.query(
      "INSERT INTO template_responses(email,subject,message,template_id,completed,title,user_id) VALUES($1,$2,$3,$4,$5,$6,$7) returning *",
      [email, subject, message, template_id, false, title,user_id]
    );
    // const data = userData.rows[0]
    if (userData.rows.length === 0) {
      res.json({ error: true, data: [], message: "Can't Share Template!" });
    } else {
      let hashedEmail = encryptData(email);
      const btnText = `Click to View`;
      // console.log(email)
      const resetLink = `${urls.templateDocument}/${hashedUrl}/${hashedEmail}`;
      console.log(email);
      console.log(resetLink);
      SendEsignEmailTemplate(
        email,
         resetLink,
          subject,
          message,
           btnText,
           title,
              user_name_sender,
              email_user,
              company_logo
          );
      // Log Maintain
      //  audit log FILE
      const event_type_file = "TEMPLATE-SHARED";
      let description = `${email_user} shared template ${title} with ${email}`;

      const file_audit_result = await pool.query(
        "INSERT INTO template_log(template_id,description,email,event,location_country,ip_address,location_date,timezone,user_shared_email) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *",
        [
          template_id,
          description,
          email_user,
          event_type_file,
          location_country,
          ip_address,
          location_date,
          timezone,
          email,
        ]
      );
      if (file_audit_result.rows.length === 0) {
        console.log("FILE LOG MAINTAIN ERROR SIGN IN");
      } else {
        console.log("FILE SUCCESS LOG SIGN IN ");
      }
      // end audit log FILE
      res.json({
        error: false,
        url_data: `${urls.templateDocument}/${hashedUrl}/${hashedEmail}`,
        message: "Shared Template Successfully!",
      });
    }
  } catch (err) {
    console.log(err);
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
exports.unHashTemplates = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      url_hashed,
      email,
      location_country,
      ip_address,
      location_date,
      timezone,
    } = req.body;
    console.log(url_hashed);
    let DecryptHashId = decryptData(url_hashed);
    let DecryptEmailId = decryptData(email);

    console.log(DecryptHashId);
    const userDataCheck = await pool.query(
      "SELECT * FROM template WHERE url=$1",
      [DecryptHashId]
    );
    if (userDataCheck.rows.length === 0) {
      res.json({ error: true, data: [], message: "Template Doesnot Exist" });
    } else {
      console.log(userDataCheck.rows[0]);
      const TempId = userDataCheck.rows[0].template_id;
      const TempName = userDataCheck.rows[0].file_name;
      const User_Id = userDataCheck.rows[0].user_id;
      const UserCheckExist = await pool.query(
        "SELECT * FROM users WHERE user_id=$1",
        [User_Id]
      );

      const tempCreatedEmail = UserCheckExist.rows[0].email;

      const userDataCheckEmail = await pool.query(
        "SELECT * FROM template_responses WHERE email=$1 AND template_id=$2",
        [DecryptEmailId, TempId]
      );
      if (userDataCheckEmail.rows.length === 0) {
        res.json({ error: true, data: [], message: "UnAuthorized User" });
      } else {
        const email_d = userDataCheckEmail.rows[0].email;
        // Log Maintain
        //  audit log FILE
        const event_type_file = "TEMPLATE-OPENED";
        let description = `${email_d} opened template ${TempName} `;

        const file_audit_result = await pool.query(
          "INSERT INTO template_log(template_id,description,email,event,location_country,ip_address,location_date,timezone,user_shared_email) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *",
          [
            TempId,
            description,
            tempCreatedEmail,
            event_type_file,
            location_country,
            ip_address,
            location_date,
            timezone,
            email_d,
          ]
        );
        if (file_audit_result.rows.length === 0) {
          console.log("FILE LOG MAINTAIN ERROR SIGN IN");
        } else {
          console.log("FILE SUCCESS LOG SIGN IN ");
        }
        // end audit log FILE
        res.json({
          error: false,
          template_id: userDataCheck.rows[0].template_id,
          userDataCheckEmail: userDataCheckEmail.rows[0],
          message: "Get Data Successfully!",
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
exports.downloaded_template_shared = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      template_id,
      file_name,
      location_country,
      user_shared_email,
      ip_address,
      location_date,
      timezone,
    } = req.body;
    const event_type_file = "TEMPLATE-DOWNLOADED";
    let description = `${user_shared_email} downloaded template ${file_name} `;
    const FileDataCheckPos = await pool.query(
      "SELECT * FROM template WHERE template_id=$1",
      [template_id]
    );
    if (FileDataCheckPos.rows.length === 0) {
      res.json({ error: true, data: [], message: "Template not Found!" });
    } else {
      const tempCreatedEmail = FileDataCheckPos.rows[0].user_id;
      const FileDataCheckUser = await pool.query(
        "SELECT * FROM users WHERE user_id=$1",
        [tempCreatedEmail]
      );
      if (FileDataCheckUser.rows.length === 0) {
        res.json({ error: true, data: [], message: "User Not Exist!" });
      } else {
        const emailData = FileDataCheckUser.rows[0].email;
        const file_audit_result = await pool.query(
          "INSERT INTO template_log(template_id,description,email,event,location_country,ip_address,location_date,timezone,user_shared_email) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *",
          [
            template_id,
            description,
            emailData,
            event_type_file,
            location_country,
            ip_address,
            location_date,
            timezone,
            user_shared_email,
          ]
        );
        if (file_audit_result.rows.length === 0) {
          console.log("FILE LOG MAINTAIN ERROR SIGN IN");
          res.json({ error: true, data: [], message: "Can't Maintain" });
        } else {
          console.log("FILE SUCCESS LOG SIGN IN ");
          res.json({
            error: false,
            message: "FILE LOG MAIN SUCCESS",
          });
        }
      }
    }
  } catch (err) {
    console.log(err);
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
// generate Pdf
async function createPDF(imagesData) {
  const pdfDoc = await PDFDocument.create();
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // Add images and overlay text/signatures
  for (const { imageUrl, positions } of imagesData) {
    // const imageBytes = fs.readFileSync(imageUrl);
    const imageBytes = fs.readFileSync(imageUrl);

    const image = await pdfDoc.embedPng(
      "http://localhost:3002/uploads//1709642314928.png"
    );

    for (const { text, x, y } of positions) {
      firstPage.drawImage(image, {
        x: x,
        y: y,
        width: 100, // Example width, adjust as needed
        height: 100, // Example height, adjust as needed
      });

      // Overlay text
      firstPage.drawText(text, {
        x: x, // Example position, adjust as needed
        y: y - 10, // Example position, adjust as needed
        size: 10, // Example size, adjust as needed
        color: rgb(0, 0, 0), // Example color, adjust as needed
      });
    }
  }
  // Save PDF to file
  const pdfBytes = await pdfDoc.save();
  const pdfPath = "output.pdf";
  fs.writeFileSync(pdfPath, pdfBytes);
  return pdfPath;
}

exports.generate_pdf = async (req, res) => {
  const { images, positions } = req.body;

  try {
    const pdfPath = await createPDF(
      images.map((imageUrl, index) => ({
        imageUrl,
        positions: positions[index],
      }))
    );

    res.json({ pdfUrl: `http://localhost:${port}/${pdfPath}` }); // Adjust URL as needed
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};
exports.addTemplateResponse = async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, position_array } = req.body;
    const query =
      "INSERT INTO template_responses (email,position_array) Values ($1,$2) RETURNING *";
    const result = await pool.query(query, [email, position_array]);

    if (result.rows.length === 0) {
      res.json({
        message: "Could not insert record",
        erroe: true,
      });
    } else {
      res.json({
        message: "Created Bulk Link Response",
        error: false,
        result: result.rows[0],
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
// update bulk link file name ,url
exports.updateTemplate = async (req, res) => {
  const client = await pool.connect();
  try {
    const { bulk_link_id, file_name, url } = req.body;
    console.log(url);
    const query =
      "UPDATE bulk_links SET file_name = $2 , url = $3 WHERE bulk_link_id = $1 RETURNING *";
    const result = await pool.query(query, [bulk_link_id, file_name, url]);
    if (result.rows.length === 0) {
      res.json({
        message: "Could not update record",
        error: true,
      });
    } else {
      res.json({
        message: "Bulk Link Updated",
        error: false,
        result: result.rows[0],
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

// Add Bulk Link BgImages
exports.addTemplatesBgImgs = async (req, res) => {
  const client = await pool.connect();
  const { template_id, images, file_name, url } = req.body;
  let insertedImages = [];

  for (let i = 0; i < images.length; i++) {
    try {
      const query =
        "INSERT INTO template_bg_imgs(template_id, image) VALUES($1, $2) RETURNING *";
      const params = [template_id, images[i]];
      const result = await pool.query(query, params);

      if (result.rows.length > 0) {
        insertedImages.push(result.rows[0]);
      }
    } catch (error) {
      console.error("Error inserting into database:", error);
    }
  }
  // update file_name into bulk_links table using bulk_link_id
  const query =
    "UPDATE bulk_links SET file_name = $2 , url=$3 WHERE bulk_link_id = $1 RETURNING *";
  const result = await pool.query(query, [template_id, file_name, url]);
  if (result.rows.length === 0) {
    res.json({
      message: "Could not update record",
      error: true,
    });
  } else {
    res.json({
      message: "Bulk Link Updated",
      error: false,
      result: result.rows[0],
    });
  }

  // res.json({
  //     message: "Images inserted successfully",
  //     data: insertedImages,
  //     error: false
  // });
};
exports.getbgImagesByTemplateId = async (req, res) => {
  const client = await pool.connect();
  try {
    const file_id = req.body.template_id;
    if (!file_id) {
      return res.json({
        message: "Please provide bulk link id",
        error: true,
      });
    }

    const query = "SELECT * FROM template_bg_imgs WHERE template_id = $1";
    const result = await pool.query(query, [file_id]);

    if (result.rows[0]) {
      res.json({
        message: "Data Found ",
        error: false,
        result: result.rows,
      });
    } else {
      res.json({
        message: "No Data Found",
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
exports.saveCanvasDataWithtemplateId = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      template_id,
      position_array,
      file_name,
      email,
      location_country,
      ip_address,
      location_date,
      timezone,
    } = req.body;

    const FileDataCheck = await pool.query(
      "SELECT * FROM template WHERE template_id=$1",
      [template_id]
    );
    if (FileDataCheck.rows.length === 0) {
      res.json({ error: true, data: [], message: "template_id Doesnot Exist" });
    } else {
      const PositionDataCheck = await pool.query(
        "SELECT * FROM template_positions WHERE template_id=$1",
        [template_id]
      );
      if (PositionDataCheck.rows.length === 0) {
        const userData = await pool.query(
          "INSERT INTO template_positions(template_id,position_array) VALUES($1,$2) returning *",
          [template_id, position_array]
        );
        // const data = userData.rows[0]
        if (userData.rows.length === 0) {
          res.json({ error: true, data: [], message: "Can't Ad Position" });
        } else {
          // Log Maintain
          //  audit log FILE
          const event_type_file = "TEMPLATE-COMPLETED";
          let description = `${email} completed editing template ${file_name} `;

          const file_audit_result = await pool.query(
            "INSERT INTO template_log(template_id,description,email,event,location_country,ip_address,location_date,timezone) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *",
            [
              template_id,
              description,
              email,
              event_type_file,
              location_country,
              ip_address,
              location_date,
              timezone,
            ]
          );
          if (file_audit_result.rows.length === 0) {
            console.log("FILE LOG MAINTAIN ERROR SIGN IN");
          } else {
            console.log("FILE SUCCESS LOG SIGN IN ");
          }
          // end audit log FILE
          res.json({
            error: false,
            data: userData.rows[0],
            message: "Position Added Successfully",
          });
        }
      } else {
        let query = "UPDATE template_positions SET ";
        let index = 2;
        let values = [template_id];

        if (position_array) {
          query += `position_array = $${index} , `;
          values.push(position_array);
          index++;
        }

        query += "WHERE template_id = $1 RETURNING*";
        query = query.replace(/,\s+WHERE/g, " WHERE");
        // console.log(query);

        const result = await pool.query(query, values);
        console.log(result.rows);

        if (result.rows.length === 0) {
          res.json({ error: true, data: [], message: "Can't Add Position" });
        } else {
          res.json({
            error: false,
            data: result.rows[0],
            message: "Position Updated Successfully",
          });
        }
      }
    }
  } catch (err) {
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
exports.saveTemplateResponse = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      template_id,
      position_array,
      email_response,
      completed_at,
      location_country,
      file_name,
      location_date,
      ip_address,
      timezone,
    } = req.body;

    const FileDataCheck = await pool.query(
      "SELECT * FROM template WHERE template_id=$1",
      [template_id]
    );
    if (FileDataCheck.rows.length === 0) {
      res.json({ error: true, data: [], message: "Template not exist!" });
    } else {
      console.log("FileDataCheck.rows[0]");

      console.log(FileDataCheck.rows[0]);

      const template_id_data = FileDataCheck?.rows[0]?.user_id;
      const FileCheckCreaterEmail = await pool.query(
        "SELECT * FROM users WHERE user_id=$1",
        [template_id_data]
      );
      let email_data = FileCheckCreaterEmail?.rows[0]?.email;
      console.log(email_data);

      console.log(email_data);
      const FileDataCheckPos = await pool.query(
        "SELECT * FROM template_responses WHERE template_id=$1 AND email=$2",
        [template_id, email_response]
      );
      const message = FileDataCheckPos.rows[0].message;
      const subject = FileDataCheckPos.rows[0].subject;
      const title = FileDataCheckPos.rows[0].title;
      const created_at = FileDataCheckPos.rows[0].created_at;

      if (FileDataCheckPos.rows.length === 0) {
        res.json({ error: true, data: [], message: "Invalid response" });
      } else {
        const deleteUserQuery = await pool.query(
          "DELETE FROM template_responses WHERE email = $1 AND template_id=$2",
          [email_response, template_id]
        );

        const ReceivedResponse = await pool.query(
          "INSERT INTO template_responses(template_id,position_array,email,completed,message,subject,title,completed_at,timezone,created_at_date,user_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *",
          [
            template_id,
            // email_response,
            position_array,
            email_response,
            true,
            message,
            subject,
            title,
            completed_at,
            timezone,
            created_at,
            template_id_data
          ]
        );
        // const data = userData.rows[0]
        if (ReceivedResponse.rows.length === 0) {
          res.json({ error: true, data: [], message: "Can't Add Response" });
        } else {
          // Log Maintain
          //  audit log FILE
          const event_type_file = "TEMPLATE-RESPONSE-FINISH";
          let description = `${email_response} completed template ${file_name} `;

          const file_audit_result = await pool.query(
            "INSERT INTO template_log(template_id,description,email,event,location_country,ip_address,location_date,timezone,user_shared_email) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *",
            [
              template_id,
              description,
              email_data,
              event_type_file,
              location_country,
              ip_address,
              location_date,
              timezone,
              email_response,
            ]
          );
          if (file_audit_result.rows.length === 0) {
            console.log("FILE LOG MAINTAIN ERROR SIGN IN");
          } else {
            console.log("FILE SUCCESS LOG SIGN IN ");
          }
          // end audit log FILE
          res.json({
            error: false,
            data: ReceivedResponse.rows[0],
            message: "Response Submitted Successfully",
          });

          // res.json({ error: false, data: userData.rows[0], message: "Position Added Successfully" });
        }
      }
    }
  } catch (err) {
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
exports.checkEmailExistforSpecificResponse = async (req, res) => {
  const client = await pool.connect();
  try {
    const email = req.body.email;
    const bulk_link_id = req.body.template_id;
    if (!email) {
      return res.json({
        message: "Please provide email Id",
        error: true,
      });
    }

    const query =
      "SELECT * FROM template_responses WHERE email = $1 AND template_id=$2 ";
    const result = await pool.query(query, [email, bulk_link_id]);
    let position_array_data = result.rows[0].position_array;
    if (position_array_data === null || position_array_data === undefined) {
      res.json({
        message: "New email ",
        error: false,
      });
    } else {
      res.json({
        message: "Email Already Added ",
        error: true,
        result: result.rows,
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
exports.getallPositionsFromTemplateId = async (req, res) => {
  const client = await pool.connect();
  try {
    const bulk_link_id = req.body.template_id;
    if (!bulk_link_id) {
      return res.json({
        message: "Please provide Template Id",
        error: true,
      });
    }

    const query = "SELECT * FROM template_positions WHERE template_id = $1 ";
    const result = await pool.query(query, [bulk_link_id]);

    if (result.rows[0]) {
      res.json({
        message: "Data Found ",
        error: false,
        result: result.rows,
      });
    } else {
      res.json({
        message: "No Data Found",
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
exports.getAllTemplates = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.user_id;
    const query = `SELECT 
       t.*, 
       COUNT(tr.template_responses_id) AS total_responses,
       COUNT(CASE WHEN tr.completed = 'true' THEN 1 END) AS completed_responses,
       COUNT(CASE WHEN tr.completed = 'false' THEN 1 END) AS incomplete_responses
     FROM 
       template t
     LEFT JOIN 
     template_responses tr ON t.template_id::text = tr.template_id
     WHERE 
       t.user_id = $1 AND t.is_deleted=$2
     GROUP BY 
       t.template_id
     ORDER BY 
       t.created_at DESC`;
    const result = await pool.query(query, [user_id,false]);

    if (result.rows.length > 0) {
      res.json({
        message: "All Fetched templates",
        error: false,
        result: result.rows,
      });
    } else {
      res.json({
        message: "Could not fetch record",
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

// viewTemplate by bulk_link_id
exports.viewTemplate = async (req, res) => {
  const client = await pool.connect();
  try {
    const bulk_link_id = req.body.template_id;
    const query = "SELECT * FROM template WHERE template_id = $1";

    const result = await pool.query(query, [bulk_link_id]);
    if (result.rows.length === 0) {
      res.json({
        message: "No record found",
        error: true,
      });
    } else {
      const created_template_date = result.rows[0].created_at;
      const query1 = "SELECT * FROM template_responses WHERE template_id = $1";

      const result1 = await pool.query(query1, [bulk_link_id]);
      res.json({
        message: "Record Found",
        error: false,
        result: result.rows[0],
        responses_received: result1.rows.length,
        response_data: result1.rows,
        created_template_date: created_template_date,
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
exports.viewTemplateAuditLog = async (req, res) => {
  const client = await pool.connect();
  try {
    const bulk_link_id = req.body.template_id;
    const query = "SELECT * FROM template WHERE template_id = $1";

    const result = await pool.query(query, [bulk_link_id]);
    if (result.rows.length === 0) {
      res.json({
        message: "No record found",
        error: true,
      });
    } else {
      const query1 = "SELECT * FROM template_log WHERE template_id = $1";

      const result1 = await pool.query(query1, [bulk_link_id]);
      res.json({
        message: "Record Found",
        error: false,
        result: result.rows[0],
        response_data: result1.rows,
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
exports.viewTemplateAuditLogSingle = async (req, res) => {
  const client = await pool.connect();
  try {
    const template_id = req.body.template_id;
    const email = req.body.email;

    const query = "SELECT * FROM template WHERE template_id = $1";

    const result = await pool.query(query, [template_id]);
    if (result.rows.length === 0) {
      res.json({
        message: "No record found",
        error: true,
      });
    } else {
      const user_id = result.rows[0].user_id; // Assuming user_id is a foreign key in bulk_links table
      console.log(email);
      // Fetch user email using user_id
      const userQuery = "SELECT * FROM users WHERE user_id = $1";
      const userResult = await pool.query(userQuery, [user_id]);
      const userEmails = userResult.rows[0].email; // Assuming user email is unique, you can add more emails here
      console.log(userEmails);
      // Fetch bulk link logs for the obtained user emails
      const query1 =
        "SELECT * FROM template_log WHERE email = $1 AND user_shared_email = $2 AND template_id=$3"; // Adjust based on the number of emails
      const result1 = await pool.query(query1, [userEmails, email,template_id]);
      res.json({
        message: "Record Found",
        error: false,
        result: result.rows[0],
        response_data: result1.rows,
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
// get all responses of bulk links
exports.viewTemplateResponses = async (req, res) => {
  const client = await pool.connect();
  try {
    const bulk_link_id = req.body.bulk_link_id;
    const query = "SELECT * FROM bulk_link_responses WHERE bulk_link_id = $1";

    const result = await pool.query(query, [bulk_link_id]);
    if (result.rows.length === 0) {
      res.json({
        message: "No record found",
        error: true,
      });
    } else {
      res.json({
        message: "Record Found",
        error: false,
        result: result.rows,
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

// get Array of bulk_link ids from post body and do active status of all the bulk link ids provided if id not exist then do mpve to next
exports.updateStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const bulk_link_ids = req.body.bulk_link_ids;
    console.log(bulk_link_ids);
    const status = req.body.status;

    let updatedTemplates = [];
    for (let i = 0; i < bulk_link_ids.length; i++) {
      const query =
        "UPDATE bulk_links SET status = $2 WHERE bulk_link_id= $1 RETURNING*";
      const result = await pool.query(query, [bulk_link_ids[i].item, status]);
      if (result.rows[0]) {
        updatedTemplates.push(result.rows[0]);
      }
    }
    if (updatedTemplates.length > 0) {
      res.json({
        message: "Status updated",
        error: false,
        result: updatedTemplates,
      });
    } else {
      res.json({
        message: "Could not update record",
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
// get Array of bulk_link ids from post body and do delete of all the bulk link ids provided if id not exist then do mpve to next
exports.deleteTemplates = async (req, res) => {
  const client = await pool.connect();
  try {
    const bulk_link_ids = req.body.template_id;
      // const query = "DELETE FROM template WHERE template_id= $1 RETURNING*";
      // const result = await pool.query(query, [bulk_link_ids]);
      let query = "UPDATE template SET ";
      let index = 2;
      let values = [bulk_link_ids];
      const is_deleted=true
  
      if (is_deleted) {
        query += `is_deleted = $${index} , `;
        values.push(is_deleted);
        index++;
      }
      query += "WHERE template_id = $1 RETURNING*";
      query = query.replace(/,\s+WHERE/g, " WHERE");
      // console.log(query);
  
      const result = await pool.query(query, values);
     
      
    if (result.rows.length === 0) {
     res.json({
        message: "Could not delete record",
        error: true,
      }); 
    } else {
      res.json({
        message: "Template Deleted",
        error: false,
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

exports.viewActiveTemplate = async (req, res) => {
  const client = await pool.connect();

  try {
    const query = "SELECT * FROM terms_and_condtions WHERE status = $1";
    const result = await pool.query(query, ["active"]);

    if (result.rows[0]) {
      res.json({
        message: "Active term_condition fetched",
        status: true,
        result: result.rows[0],
      });
    } else {
      res.json({
        message: "No terms and condtions found",
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
