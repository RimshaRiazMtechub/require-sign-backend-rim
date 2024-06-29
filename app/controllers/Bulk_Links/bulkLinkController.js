const { pool } = require("../../config/db.config");
const urls = require("../../urls");
const SigningEmailtemplate = require("../signingEmailDoc");
const { v4: uuidv4 } = require("uuid");
exports.addBulkLinks = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      title,
      user_id,
      welcome_message,
      acknowledgement_message,
      response,
      limit_responses,
      link_response_limit,
      total_responses,
      expiry_date,
      file_name,
      url,
      status,
      expires_option,
      signer_functional_controls,
      user_email_verification,
      allow_download_after_submission,
      users_receive_copy_in_email,
    
    } = req.body;
    let UniqId = uuidv4();  
    const query =
      "INSERT INTO bulk_links (title,welcome_message,user_id,acknowledgement_message,response,limit_responses,link_response_limit,total_responses,expires_option,expiry_date,file_name,url,status,signer_functional_controls,user_email_verification,allow_download_after_submission,users_receive_copy_in_email,editable,uniq_id) Values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *";
    const result = await pool.query(query, [
      title,
      welcome_message,
      user_id,
      acknowledgement_message,
      response || null,
      limit_responses,
      link_response_limit || null,
      total_responses || null,
      expires_option || null,
      expiry_date || null,
      file_name || null,
      url || null,
      status || "active",
      signer_functional_controls,
      user_email_verification,
      allow_download_after_submission,
      users_receive_copy_in_email,
      true,
      UniqId
    ]);

    if (result.rows.length === 0) {
      res.json({
        message: "Could not insert record",
        erroe: true,
      });
    } else {
      res.json({
        message: "Created Bulk Link",
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
exports.addBulkLinkResponse = async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, bulk_link_id } = req.body;
    const query =
      "INSERT INTO bulk_link_responses (email,bulk_link_id) Values ($1,$2) RETURNING *";
    const result = await pool.query(query, [email, bulk_link_id]);

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
exports.updateBulkLink = async (req, res) => {
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
exports.addBulkLinksBgImgs = async (req, res) => {
  const client = await pool.connect();
  const {
    bulk_link_id,
    images,
    file_name,
    url,
    file_url,
    location_country,
    email,
    ip_address,
    location_date,
    timezone,
  } = req.body;
  const query =
    "UPDATE bulk_links SET file_name = $2 , url=$3,file_url=$4 WHERE bulk_link_id = $1 RETURNING *";
  const result = await pool.query(query, [
    bulk_link_id,
    file_name,
    url,
    file_url,
  ]);
  if (result.rows.length === 0) {
    res.json({
      message: "Could not update record",
      error: true,
    });
  } else {
    //  audit log FILE
    const event_type_file = "BULK-LINK-CREATED";
    let description = `${email} created bulk link ${file_name} `;

    const file_audit_result = await pool.query(
      "INSERT INTO bulk_link_log(bulk_link_id,description,email,event,location_country,ip_address,location_date,timezone) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *",
      [
        bulk_link_id,
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
      message: "Bulk Link Updated",
      error: false,
      result: result.rows[0],
    });
  }
};
exports.getbgImagesByBulkLinkId = async (req, res) => {
  const client = await pool.connect();
  try {
    const file_id = req.body.bulk_link_id;
    if (!file_id) {
      return res.json({
        message: "Please provide bulk link id",
        error: true,
      });
    }

    const query = "SELECT * FROM bulk_link_bgimgs WHERE bulk_link_id = $1";
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
exports.saveCanvasDataWithBulk_LinkId = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      bulk_link_id,
      position_array,
      file_name,
      email,
      location_country,
      ip_address,
      location_date,
      timezone,
      // email_response
    } = req.body;

    const FileDataCheck = await pool.query(
      "SELECT * FROM bulk_links WHERE bulk_link_id=$1",
      [bulk_link_id]
    );
    if (FileDataCheck.rows.length === 0) {
      res.json({
        error: true,
        data: [],
        message: "bulk_link_id Doesnot Exist",
      });
    } else {
      console.log("y");
      const FileDataCheckPos = await pool.query(
        "SELECT * FROM bulk_link_positions WHERE bulk_link_id=$1",
        [bulk_link_id]
      );
      if (FileDataCheckPos.rows.length === 0) {
        const ReceivedResponse = await pool.query(
          "INSERT INTO bulk_link_positions(bulk_link_id,position_array) VALUES($1,$2) returning *",
          [
            bulk_link_id,
            // email_response,
            position_array,
          ]
        );
        // const data = userData.rows[0]
        if (ReceivedResponse.rows.length === 0) {
          res.json({ error: true, data: [], message: "Can't Add Response" });
        } else {
          console.log("O");
          res.json({
            error: false,
            data: ReceivedResponse.rows[0],
            message: "Position Updated Successfully",
          });

          // res.json({ error: false, data: userData.rows[0], message: "Position Added Successfully" });
        }
      } else {
        console.log("B");
        let query = "UPDATE bulk_link_positions SET ";
        let index = 2;
        let values = [bulk_link_id];

        if (position_array) {
          query += `position_array = $${index} , `;
          values.push(position_array);
          index++;
        }

        query += "WHERE bulk_link_id = $1 RETURNING*";
        query = query.replace(/,\s+WHERE/g, " WHERE");
        // console.log(query);

        const result = await pool.query(query, values);

        // console.log(result)

        if (result.rows.length === 0) {
          res.json({ error: true, data: [], message: "Can't Add Position" });
        } else {
          console.log("L");
          // Log Maintain
          //  audit log FILE
          const event_type_file = "BULK-LINK-COMPLETED";
          let description = `${email} complete bulk link ${file_name} `;

          const file_audit_result = await pool.query(
            "INSERT INTO bulk_link_log(bulk_link_id,description,email,event,location_country,ip_address,location_date,timezone) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *",
            [
              bulk_link_id,
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
            data: result,
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
exports.saveBulkLinkResponse = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      bulk_link_id,
      position_array,
      email_response,
      location_country,
      ip_address,
      location_date,
      file_name,
      timezone,
      pdfLink
    } = req.body;

    const FileDataCheck = await pool.query(
      "SELECT * FROM bulk_links WHERE bulk_link_id=$1",
      [bulk_link_id]
    );
    if (FileDataCheck.rows.length === 0) {
      res.json({
        error: true,
        data: [],
        message: "Response with this email exist!",
      });
    } else {
      const file_name=FileDataCheck.rows[0].file_name;
      let receiveCopy=FileDataCheck.rows[0].users_receive_copy_in_email;

      
      const FileDataCheckPos = await pool.query(
        "SELECT * FROM bulk_link_responses WHERE bulk_link_id=$1 AND email=$2",
        [bulk_link_id, email_response]
      );
      if (FileDataCheckPos.rows.length === 0) {
        const ReceivedResponse = await pool.query(
          "INSERT INTO bulk_link_responses(bulk_link_id,position_array,email,pdf_link) VALUES($1,$2,$3,$4) returning *",
          [
            bulk_link_id,
            // email_response,
            position_array,
            email_response,
            pdfLink
          ]
        );
        // const data = userData.rows[0]
        if (ReceivedResponse.rows.length === 0) {
          res.json({ error: true, data: [], message: "Can't Add Response" });
        } else {
          // Log Maintain
          //  audit log FILE
          // const event_type_file = "BULK-LINK-RESPONSE-CREATED";
          // let description = `${email_response} submitted bulk link ${file_name} response  `;

          // const file_audit_result = await pool.query(
          //   "INSERT INTO bulk_link_log(bulk_link_id,description,email,event,location_country,ip_address,location_date,timezone) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *",
          //   [
          //     bulk_link_id,
          //     description,
          //     email_response,
          //     event_type_file,
          //     location_country,
          //     ip_address,
          //     location_date,
          //     timezone,
          //   ]
          // );
          // if (file_audit_result.rows.length === 0) {
          //   console.log("FILE LOG MAINTAIN ERROR SIGN IN");
          // } else {
          //   console.log("FILE SUCCESS LOG SIGN IN ");
          // }
          // send email 
          const btnText = `Click to View`;
          const first_name =email_response;
          const last_name = "";
          const email = email_response;

          const email_subject = `Email Copy Pdf Bulk Link: ${file_name}`;
          let linkView = `${urls.urlApid}${pdfLink}`.replace(/\\/g, '/');
          const email_message = ` The file name <span style="font-weight:700"> ${file_name}</span> has been completed by you.View completed document by this link <a href="${linkView}">View Document</a>`;
          console.log("recipient");

          console.log(email);
          const resetLink =`${urls.urlApid}${pdfLink}`.replace(/\\/g, '/');
          console.log(resetLink);
           if(receiveCopy===true||receiveCopy==="true"){
 SigningEmailtemplate(
            email,
            resetLink,
            first_name,
            last_name,
            email_subject,
            email_message,
            btnText
          );
           }else{

           }
         
          // end audit log FILE
          res.json({
            error: false,
            data: ReceivedResponse.rows[0],
            message: "Response Submitted Successfully",
          });

          // res.json({ error: false, data: userData.rows[0], message: "Position Added Successfully" });
        }
      } else {
        res.json({ error: true, data: [], message: "Response Already Added" });
      }
    }
  } catch (err) {
    console.log(err)
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
exports.auditLogBulk = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      bulk_link_id,
      email,
      location_country,
      ip_address,
      location_date,
      timezone,
      event,
      description,
    } = req.body;
    const file_audit_result = await pool.query(
      "INSERT INTO bulk_link_log(bulk_link_id,description,email,event,location_country,ip_address,location_date,timezone) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *",
      [
        bulk_link_id,
        description,
        email,
        event,
        location_country,
        ip_address,
        location_date,
        timezone,
      ]
    );
    if (file_audit_result.rows.length === 0) {
      console.log("FILE LOG MAINTAIN ERROR SIGN IN");
      res.json({ error: true, data: [], message: "Can't Maintain" });
    } else {
      console.log("FILE SUCCESS LOG SIGN IN ");
      res.json({
        error: false,
        message: "FILE LOG MAINTAIN SUCCESS",
      });
    }
  } catch (err) {
    console.log(err);
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};

exports.checkEmailExistforSpecificResponse = async (req, res) => {
  const client = await pool.connect();
  try {
    const email = req.body.email;
    const bulk_link_id = req.body.bulk_link_id;
    if (!email) {
      return res.json({
        message: "Please provide email Id",
        error: true,
      });
    }

    const query =
      "SELECT * FROM bulk_link_responses WHERE email = $1 AND bulk_link_id=$2 ";
    const result = await pool.query(query, [email, bulk_link_id]);

    if (result.rows.length === 0) {
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
exports.getallPositionsFromBulkLinkId = async (req, res) => {
  const client = await pool.connect();
  try {
    const bulk_link_id = req.body.bulk_link_id;
    if (!bulk_link_id) {
      return res.json({
        message: "Please provide bulk_link Id",
        error: true,
      });
    }

    const query = "SELECT * FROM bulk_link_positions WHERE bulk_link_id = $1 ";
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
exports.getAllBulkLinks = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.user_id;
    const query =
      "SELECT * FROM bulk_links WHERE user_id = $1 ORDER BY created_at DESC";

    const result = await pool.query(query, [user_id]);

    if (result.rows.length > 0) {
      for (let i = 0; i < result.rows.length; i++) {
        const bulkLinkId = result.rows[i].bulk_link_id; // Assuming bulk_links table has an 'id' field

        // Fetch data from bulk_link_responses table based on bulk_link_id
        const responseQuery =
          "SELECT * FROM bulk_link_responses WHERE bulk_link_id = $1";
        const responseResult = await pool.query(responseQuery, [bulkLinkId]);

        // Add the fetched response data to the corresponding object in result.rows array
        result.rows[i].responses = responseResult.rows.length;
      }
      res.json({
        message: "All Fetched bulk_links",
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

// viewBulkLink by bulk_link_id
exports.viewBulkLink = async (req, res) => {
  const client = await pool.connect();
  try {
    const bulk_link_id = req.body.bulk_link_id;
    const query = "SELECT * FROM bulk_links WHERE bulk_link_id = $1";

    const result = await pool.query(query, [bulk_link_id]);
    if (result.rows.length === 0) {
      res.json({
        message: "No record found",
        error: true,
      });
    } else {
      const query1 =
        "SELECT * FROM bulk_link_responses WHERE bulk_link_id = $1";

      const result1 = await pool.query(query1, [bulk_link_id]);

      res.json({
        message: "Record Found",
        error: false,
        result: result.rows[0],
        responses_received: result1.rows.length,
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
exports.viewBulkLinkAuditLog = async (req, res) => {
  const client = await pool.connect();
  try {
    const bulk_link_id = req.body.bulk_link_id;
    const query = "SELECT * FROM bulk_links WHERE bulk_link_id = $1";

    const result = await pool.query(query, [bulk_link_id]);
    if (result.rows.length === 0) {
      res.json({
        message: "No record found",
        error: true,
      });
    } else {
      const query1 = "SELECT * FROM bulk_link_log WHERE bulk_link_id = $1";

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
exports.viewBulkLinkAuditLogSingle = async (req, res) => {
  const client = await pool.connect();
  try {
    const bulk_link_id = req.body.bulk_link_id;
    const email = req.body.email;

    const query = "SELECT * FROM bulk_links WHERE bulk_link_id = $1";

    const result = await pool.query(query, [bulk_link_id]);
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
        "SELECT * FROM bulk_link_log WHERE (email = $1 OR email = $2) AND bulk_link_id=$3"; // Adjust based on the number of emails
      const result1 = await pool.query(query1, [
        userEmails,
        email,
        bulk_link_id,
      ]);
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
exports.viewBulkLinkResponses = async (req, res) => {
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

    let updatedBulkLinks = [];
    for (let i = 0; i < bulk_link_ids.length; i++) {
      const query =
        "UPDATE bulk_links SET status = $2 WHERE bulk_link_id= $1 RETURNING*";
      const result = await pool.query(query, [bulk_link_ids[i].item, status]);
      if (result.rows[0]) {
        updatedBulkLinks.push(result.rows[0]);
      }
    }
    if (updatedBulkLinks.length > 0) {
      res.json({
        message: "Status updated",
        error: false,
        result: updatedBulkLinks,
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
exports.deleteBulkLinks = async (req, res) => {
  const client = await pool.connect();
  try {
    const bulk_link_ids = req.body.bulk_link_ids;
    let deletedBulkLinks = [];
    for (let i = 0; i < bulk_link_ids.length; i++) {
      const query = "DELETE FROM bulk_links WHERE bulk_link_id= $1 RETURNING*";
      const result = await pool.query(query, [bulk_link_ids[i].item]);
      if (result.rows[0]) {
        deletedBulkLinks.push(result.rows[0]);
      }
    }
    if (deletedBulkLinks.length > 0) {
      res.json({
        message: "Bulk Link Deleted",
        error: false,
        result: deletedBulkLinks,
      });
    } else {
      res.json({
        message: "Could not delete record",
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

exports.viewActiveBulkLink = async (req, res) => {
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
