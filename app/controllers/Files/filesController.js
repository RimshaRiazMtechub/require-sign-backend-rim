const { pool } = require("../../config/db.config");
const { fromPath } = require("pdf2pic");

const crypto = require("crypto");
var nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
// const pdfPoppler = require('pdf-poppler');
const fs = require("fs");
const SigningEmailtemplate = require("../signingEmailDoc");
const urls = require("../../urls");
const encryptData = require("../../utils/encrypt");
const decryptData = require("../../utils/decrypt");
const SendEsignEmail = require("../../EmailUtils/send_to_esign_email");
// const pdf = require('pdf-poppler');
// const unlinkAsync = promisify(fs.unlink);
exports.createFolder = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { user_id, folder_name, subFolder, subFolder_id, status } = req.body;
    const userDataCheck = await pool.query(
      "SELECT * FROM users WHERE customer_id=$1",
      [user_id]
    );
    if (userDataCheck.rows.length === 0) {
      res.json({ error: true, data: [], message: "User Doesnot Exist" });
    } else {
      if (subFolder) {
        // uniq_id = uuidv4();
        // console.log(uuidv4())
        if (
          subFolder_id === null ||
          subFolder_id === undefined ||
          subFolder_id === ""
        ) {
          res.json({ error: false, data, message: "Provide Sub folder Id " });
        } else {
          const userData = await pool.query(
            "INSERT INTO Folder(user_id,folder_name,uniq_id,subFolder,subFolder_id,status,is_deleted,is_archieved) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *",
            [
              user_id,
              folder_name,
              uuidv4(),
              subFolder,
              subFolder_id,
              "InProgress",
              false,
              false,
            ]
          );
          const data = userData.rows[0];
          res.json({
            error: false,
            data,
            message: "Folder Added Successfully",
          });
        }
      } else {
        const userData = await pool.query(
          "INSERT INTO Folder(user_id,folder_name,uniq_id,subFolder,subFolder_id,status,is_deleted,is_archieved) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *",
          [
            user_id,
            folder_name,
            uuidv4(),
            subFolder,
            null,
            "InProgress",
            false,
            false,
          ]
        );
        const data = userData.rows[0];
        res.json({ error: false, data, message: "Folder Added Successfully" });
      }
      // Generate a unique ID using the uuid module
    }
  } catch (err) {
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
// get count of files whose status are InProgress ,WaitingForOthers,WaitingForMe,Completed by user id
exports.getFilesCount = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { user_id } = req.body;
    const userDataCheck = await pool.query(
      "SELECT * FROM users WHERE user_id=$1",

      [user_id]
    );
    if (userDataCheck.rows.length === 0) {
      res.json({ error: true, data: [], message: "User Doesnot Exist" });
    } else {
      const userData = await pool.query(
        `
            SELECT 
                SUM(CASE WHEN status = $2 THEN 1 ELSE 0 END) as InProgress,
                SUM(CASE WHEN status = $3 THEN 1 ELSE 0 END) as WaitingForOthers,
                SUM(CASE WHEN status = $4 THEN 1 ELSE 0 END) as WaitingForMe,
                SUM(CASE WHEN status = $5 THEN 1 ELSE 0 END) as Completed
            FROM files 
            WHERE user_id = $1
            AND is_deleted = false
            AND is_trash_deleted = false
            AND is_archieved = false
        `,
        [user_id, "InProgress", "WaitingForOthers", "WaitingForMe", "Completed"]
      );
      const data = userData.rows[0];

      const user_email = userDataCheck.rows[0].email;
      console.log(user_email);
      console.log("WaitingForMe");
      const query = `
  SELECT Files.*
  FROM Files
  JOIN signer ON Files.file_id::TEXT = signer.file_id
  WHERE signer.email = $1
  AND (signer.completed_status = 'false' OR signer.completed_status IS NULL)
`;
      const values = [user_email]; // Assuming user_id is the email

      const result1 = await client.query(query, values);
      res.json({
        error: false,
        data,
        waitingForMe: result1.rows.length,
        message: "Data Found",
      });
    }
  } catch (err) {
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
exports.getFilesActivityLog = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { file_id } = req.body;
    const userDataCheck = await pool.query(
      "SELECT * FROM file_log WHERE file_id=$1",
      [file_id]
    );
    const userDataCheckFile = await pool.query(
      "SELECT * FROM Files WHERE file_id=$1",
      [file_id]
    );
    res.json({
      error: false,
      data: userDataCheck.rows,
      fileDetail: userDataCheckFile.rows,
      message: "Fetched activity Log success",
    });
  } catch (err) {
    console.log(err);
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};

// create file
exports.createfile = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { user_id, file_name, subfolder, subfolder_id, onlySigner, bgimgs } =
      req.body;
    console.log(bgimgs);
    console.log(subfolder);

    const userDataCheck = await pool.query(
      "SELECT * FROM users WHERE user_id=$1",
      [user_id]
    );
    if (userDataCheck.rows.length === 0) {
      res.json({ error: true, data: [], message: "User Doesnot Exist" });
    } else {
      console.log("User Exist");
      if (subfolder === true || subfolder === "true") {
        // uniq_id = uuidv4();
        // console.log(uuidv4())
        console.log("subfolder Exist");

        if (
          subfolder_id === null ||
          subfolder_id === undefined ||
          subfolder_id === ""
        ) {
          res.json({ error: false, data, message: "Provide Sub file Id " });
        } else {
          const userData = await pool.query(
            "INSERT INTO Files(user_id,name,uniq_id,subfolder,subfolder_id,status,is_deleted,is_archieved,only_signer,is_trash_deleted) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *",
            [
              user_id,
              file_name,
              uuidv4(),
              subfolder,
              subfolder_id,
              "InProgress",
              false,
              false,
              onlySigner,
              false,
            ]
          );
          const data = userData.rows[0];
          console.log("file added sub");
          res.json({ error: false, data, message: "file Added Successfully" });
        }
      } else {
        console.log("files Not subfolder");
        const userData = await pool.query(
          "INSERT INTO files(user_id,name,uniq_id,subfolder,subfolder_id,status,is_deleted,is_archieved,only_signer,is_trash_deleted) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *",
          [
            user_id,
            file_name,
            uuidv4(),
            subfolder,
            null,
            "InProgress",
            false,
            false,
            onlySigner,
            false,
          ]
        );
        // const data = userData.rows[0]
        if (userData.rows.length === 0) {
          res.json({ error: true, data: [], message: "Can't Save file" });
        } else {
          // res.json({ error: false, data: userData.rows[0], message: "File Added Successfully" });
          const file_id = userData.rows[0].file_id;
          console.log(userData.rows[0].file_id);
          // Add bg Images
          for (let i = 0; i < bgimgs.length; i++) {
            // const data = userData.rows[0]
            try {
              const userData1 = await pool.query(
                "INSERT INTO bgimgs(file_id,image) VALUES($1,$2) returning *",
                [file_id, bgimgs[i]]
              );
              // console.log(userData1.rows[0]);
              if (userData1.rows.length === 0) {
                // Handle the case where no rows were returned.
              } else {
                // Handle the case where rows were returned.
              }
            } catch (error) {
              console.error("Error inserting into database:", error);
            }
          }
          res.json({
            error: false,
            data: userData.rows[0],
            message: "File Added Successfully",
          });
        }
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
exports.createfilev1 = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      user_id,
      file_name,
      subfolder,
      subfolder_id,
      onlySigner,
      file_url,
      location_country,
      ip_address,
      location_date,
      timezone,
      // bgimgs,
    } = req.body;
    // console.log(bgimgs)
    console.log(subfolder);

    const userDataCheck = await pool.query(
      "SELECT * FROM users WHERE user_id=$1",
      [user_id]
    );
    if (userDataCheck.rows.length === 0) {
      res.json({ error: true, data: [], message: "User Doesnot Exist" });
    } else {
      let user_email = userDataCheck.rows[0].email;
      let description = `${user_email} has created document ${file_name}`;
      console.log("User Exist");
      if (subfolder === true || subfolder === "true") {
        // uniq_id = uuidv4();
        // console.log(uuidv4())
        console.log("subfolder Exist");

        if (
          subfolder_id === null ||
          subfolder_id === undefined ||
          subfolder_id === ""
        ) {
          res.json({ error: false, data, message: "Provide Sub file Id " });
        } else {
          const userData = await pool.query(
            "INSERT INTO Files(user_id,name,uniq_id,subfolder,subfolder_id,status,is_deleted,is_archieved,only_signer,is_trash_deleted) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *",
            [
              user_id,
              file_name,
              uuidv4(),
              subfolder,
              subfolder_id,
              "InProgress",
              false,
              false,
              onlySigner,
              false,
            ]
          );
          const data = userData.rows[0];
          let file_id_data = userData.rows[0].file_id;
          console.log("file added sub");
          //  audit log

          // end audit log
          //  audit log FILE
          const event_type_file = "UPLOADED-DOC";

          const file_audit_result = await pool.query(
            "INSERT INTO file_log(user_id,description,email,file_id,event,location_country,ip_address,location_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *",
            [
              user_id,
              description,
              user_email,
              file_id_data,
              event_type_file,
              location_country,
              ip_address,
              location_date,
            ]
          );
          if (file_audit_result.rows.length === 0) {
            console.log("FILE LOG MAINTAIN ERROR SIGN IN");
          } else {
            console.log("FILE SUCCESS LOG SIGN IN ");
          }
          // end audit log FILE
          res.json({ error: false, data, message: "file Added Successfully" });
        }
      } else {
        console.log("files Not subfolder");
        const userData = await pool.query(
          "INSERT INTO files(user_id,name,uniq_id,subfolder,subfolder_id,status,is_deleted,is_archieved,only_signer,is_trash_deleted) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *",
          [
            user_id,

            file_name,
            uuidv4(),
            subfolder,
            null,
            "InProgress",
            false,
            false,
            onlySigner,
            false,
          ]
        );
        // const data = userData.rows[0]
        if (userData.rows.length === 0) {
          res.json({ error: true, data: [], message: "Can't Save file" });
        } else {
          // res.json({ error: false, data: userData.rows[0], message: "File Added Successfully" });
          const file_id = userData.rows[0].file_id;
          console.log(userData.rows[0].file_id);
          // Add bg Images
          // for (let i = 0; i < bgimgs.length; i++) {
          //     // const data = userData.rows[0]
          try {
            const userData1 = await pool.query(
              "INSERT INTO bgimgs(file_id,image) VALUES($1,$2) returning *",
              [file_id, file_url]
            );
            console.log(userData1.rows[0]);
            if (userData1.rows.length === 0) {
              // Handle the case where no rows were returned.
            } else {
              // Handle the case where rows were returned.
              console.log("dsdfsdfsdfsdfs");
            }
          } catch (error) {
            console.error("Error inserting into database:", error);
          }
          // }

          //  audit log FILE
          const event_type_file = "UPLOADED-DOC";

          const file_audit_result = await pool.query(
            "INSERT INTO file_log(user_id,description,email,file_id,event,location_country,ip_address,location_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *",
            [
              user_id,
              description,
              user_email,
              file_id,
              event_type_file,
              location_country,
              ip_address,
              location_date,
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
            message: "File Added Successfully",
          });
        }
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
// get files
exports.getfile = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { file_id } = req.body;
    const userDataCheck = await pool.query(
      "SELECT * FROM files WHERE file_id=$1",
      [file_id]
    );
    if (userDataCheck.rows.length === 0) {
      res.json({ error: true, data: [], message: "File Doesnot Exist" });
    } else {
      // console.log("File Exist")
      res.json({
        error: false,
        data: userDataCheck.rows[0],
        message: "File  Exist",
      });
    }
  } catch (err) {
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
// file moved to folder
exports.updatefileMoved = async (req, res, next) => {
  const client = await pool.connect();
  try {
  } catch (err) {
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
// update file
exports.updatefile = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      file_id,
      name,
      email_subject,
      email_message,
      status,
      signer_functional_controls,
      secured_share,
      set_esigning_order,
      subfolder,
      subfolder_id,
    } = req.body;
    let query = "UPDATE files SET ";
    let index = 2;
    let values = [file_id];

    if (name) {
      query += `name = $${index} , `;
      values.push(name);
      index++;
    }
    if (email_subject) {
      query += `email_subject = $${index} , `;
      values.push(email_subject);
      index++;
    }
    if (email_message) {
      query += `email_message = $${index} , `;
      values.push(email_message);
      index++;
    }
    if (status) {
      query += `status = $${index} , `;
      values.push(status);
      index++;
    }
    if (signer_functional_controls) {
      query += `signer_functional_controls = $${index} , `;
      values.push(signer_functional_controls);
      index++;
    }
    if (secured_share) {
      query += `secured_share = $${index} , `;
      values.push(secured_share);
      index++;
    }
    if (set_esigning_order) {
      query += `set_esigning_order = $${index} , `;
      values.push(set_esigning_order);
      index++;
    }
    if (subfolder) {
      query += `subfolder = $${index} , `;
      values.push(subfolder);
      index++;
    }
    if (subfolder_id) {
      query += `subfolder_id = $${index} , `;
      values.push(subfolder_id);
      index++;
    }
    query += "WHERE file_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);
    // console.log(result.rows[0])
    if (result.rows.length === 0) {
      res.json({ error: true, data: [], message: "Can't Update Data" });
    } else {
      res.json({
        error: false,
        data: result.rows[0],
        message: "Data Updated Successfully",
      });
    }
  } catch (err) {
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
// deleteFile Trash
exports.deleteFile = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { file_id } = req.body;
    const checkQuery = "SELECT * FROM Files WHERE file_id = $1";
    const checkResult = await pool.query(checkQuery, [file_id]);
    // const userDataCheck = await pool.query("SELECT * FROM Files WHERE file_id=$1",
    //     [file_id]);
    //     console.log(userDataCheck)
    if (checkResult.rows.length === 0) {
      res.json({ error: true, data: [], message: "File Doesnot Exist" });
    } else {
      // const deleteQuery = 'DELETE FROM Files WHERE file_id = $1';
      // await pool.query(deleteQuery, [file_id]);
      const deleteQuery =
        "UPDATE Files SET is_deleted = true, deleted_at = NOW() WHERE file_id = $1";
      await pool.query(deleteQuery, [file_id]);
      res.json({
        message: "File deleted successfully",
        error: false,
        checkResult: checkResult.rows[0],
      });
      // const userData = await pool.query("DELETE FROM Files WHERE file_id=$1",
      //     [file_id]);
      // if (userData.rows.length === 0) {
      //     res.json({ error: true, data: [], message: "Can't Delete File" });

      // } else {
      //     res.json({ error: false, data: [], message: "File Deleted Successfully" });
      // }
    }
  } catch (err) {
    console.log(err);

    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
// Archieve
exports.ArchievFile = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { file_id } = req.body;
    const checkQuery = "SELECT * FROM Files WHERE file_id = $1";
    const checkResult = await pool.query(checkQuery, [file_id]);
    // const userDataCheck = await pool.query("SELECT * FROM Files WHERE file_id=$1",
    //     [file_id]);
    //     console.log(userDataCheck)
    if (checkResult.rows.length === 0) {
      res.json({ error: true, data: [], message: "File Doesnot Exist" });
    } else {
      // const deleteQuery = 'DELETE FROM Files WHERE file_id = $1';
      // await pool.query(deleteQuery, [file_id]);
      const deleteQuery =
        "UPDATE Files SET is_archieved = true, archieved_at = NOW() WHERE file_id = $1";
      await pool.query(deleteQuery, [file_id]);
      res.json({
        message: "File Archieved Successfully",
        error: false,
      });
      // const userData = await pool.query("DELETE FROM Files WHERE file_id=$1",
      //     [file_id]);
      // if (userData.rows.length === 0) {
      //     res.json({ error: true, data: [], message: "Can't Delete File" });

      // } else {
      //     res.json({ error: false, data: [], message: "File Deleted Successfully" });
      // }
    }
  } catch (err) {
    console.log(err);

    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
// UnArchieve File
exports.UnArchievFile = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { file_id } = req.body;
    const checkQuery = "SELECT * FROM Files WHERE file_id = $1";
    const checkResult = await pool.query(checkQuery, [file_id]);
    // const userDataCheck = await pool.query("SELECT * FROM Files WHERE file_id=$1",
    //     [file_id]);
    //     console.log(userDataCheck)
    if (checkResult.rows.length === 0) {
      res.json({ error: true, data: [], message: "File Doesnot Exist" });
    } else {
      // const deleteQuery = 'DELETE FROM Files WHERE file_id = $1';
      // await pool.query(deleteQuery, [file_id]);
      const deleteQuery =
        "UPDATE Files SET is_archieved = false WHERE file_id = $1";
      await pool.query(deleteQuery, [file_id]);
      res.json({
        message: "File UnArchieved successfully",
        error: false,
      });
      // const userData = await pool.query("DELETE FROM Files WHERE file_id=$1",
      //     [file_id]);
      // if (userData.rows.length === 0) {
      //     res.json({ error: true, data: [], message: "Can't Delete File" });

      // } else {
      //     res.json({ error: false, data: [], message: "File Deleted Successfully" });
      // }
    }
  } catch (err) {
    console.log(err);

    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
// UnArchieve All
exports.UnArchieveFileAll = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { user_id } = req.body;
    // Unarchive files
    await pool.query(
      "UPDATE Files SET is_archieved = false WHERE user_id = $1 AND is_archieved = true",
      [user_id]
    );

    // Unarchive folders
    await pool.query(
      "UPDATE Folder SET is_archieved = false WHERE user_id = $1 AND is_archieved = true",
      [user_id]
    );

    res.json({
      message: "Items unarchived successfully",
      error: false,
    });
  } catch (err) {
    console.log(err);

    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
// UnArchieveFileSelected
exports.UnArchieveFileSelected = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const items = req.body.items;

    for (let i = 0; i < items.length; i++) {
      const { item, type } = items[i];

      try {
        console.log(item);
        if (type === "file") {
          // Unarchive file
          await pool.query(
            "UPDATE Files SET is_archieved = false WHERE file_id = $1 AND is_archieved = true",
            [item]
          );
        } else if (type === "folder") {
          // Unarchive folder
          await pool.query(
            "UPDATE Folder SET is_archieved = false WHERE folder_id = $1 AND is_archieved = true",
            [item]
          );
        }
      } catch (err) {
        console.log(
          `Error unarchiving ${type} with id ${item}: ${err.message}`
        );
        continue;
      }
    }

    res.json({
      message: "Items unarchived successfully",
      error: false,
    });
  } catch (err) {
    console.log(err);

    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
// restore trash
exports.restoreFile = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { file_id } = req.body;
    const checkQuery = "SELECT * FROM Files WHERE file_id = $1";
    const checkResult = await pool.query(checkQuery, [file_id]);
    // const userDataCheck = await pool.query("SELECT * FROM Files WHERE file_id=$1",
    //     [file_id]);
    //     console.log(userDataCheck)
    if (checkResult.rows.length === 0) {
      res.json({ error: true, data: [], message: "File Doesnot Exist" });
    } else {
      // const deleteQuery = 'DELETE FROM Files WHERE file_id = $1';
      // await pool.query(deleteQuery, [file_id]);
      const deleteQuery =
        "UPDATE Files SET is_deleted = false WHERE file_id = $1";
      await pool.query(deleteQuery, [file_id]);
      res.json({
        message: "File restored successfully",
        error: false,
      });
      // const userData = await pool.query("DELETE FROM Files WHERE file_id=$1",
      //     [file_id]);
      // if (userData.rows.length === 0) {
      //     res.json({ error: true, data: [], message: "Can't Delete File" });

      // } else {
      //     res.json({ error: false, data: [], message: "File Deleted Successfully" });
      // }
    }
  } catch (err) {
    console.log(err);

    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
exports.restoreFileTemp = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { file_id } = req.body;
    const checkQuery = "SELECT * FROM template WHERE template_id = $1";
    const checkResult = await pool.query(checkQuery, [file_id]);
    // const userDataCheck = await pool.query("SELECT * FROM Files WHERE file_id=$1",
    //     [file_id]);
    //     console.log(userDataCheck)
    if (checkResult.rows.length === 0) {
      res.json({ error: true, data: [], message: "File Doesnot Exist" });
    } else {
      // const deleteQuery = 'DELETE FROM Files WHERE file_id = $1';
      // await pool.query(deleteQuery, [file_id]);
      const deleteQuery =
        "UPDATE template SET is_deleted = false WHERE template_id = $1";
      await pool.query(deleteQuery, [file_id]);
      res.json({
        message: "File restored successfully",
        error: false,
      });
      // const userData = await pool.query("DELETE FROM Files WHERE file_id=$1",
      //     [file_id]);
      // if (userData.rows.length === 0) {
      //     res.json({ error: true, data: [], message: "Can't Delete File" });

      // } else {
      //     res.json({ error: false, data: [], message: "File Deleted Successfully" });
      // }
    }
  } catch (err) {
    console.log(err);

    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
// delete file permanent
// update is_deleted to false in folder table
exports.deletePermanent = async (req, res) => {
  const client = await pool.connect();
  try {
    const file_id = req.body.file_id;
    let query = "UPDATE Files SET ";
    let index = 2;
    let values = [file_id];
    let is_trash_deleted = true;

    if (is_trash_deleted) {
      query += `is_trash_deleted = $${index} , `;
      values.push(is_trash_deleted);
      index++;
    }

    query += "WHERE file_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);
    if (result.rows[0]) {
      res.json({
        message: "File deleted permanently",
        error: false,
      });
    } else {
      res.json({
        message: "Error Occurred",
        error: true,
      });
    }
    // const result = await pool.query('DELETE FROM Files WHERE file_id = $1', [file_id]);
    // res.json({
    //     message: "File deleted permanently",
    //     error: false
    // });
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
exports.deletePermanentTemp = async (req, res) => {
  const client = await pool.connect();
  try {
    const file_id = req.body.file_id;
    let query = "UPDATE template SET ";
    let index = 2;
    let values = [file_id];
    let is_trash_deleted = true;

    if (is_trash_deleted) {
      query += `is_trash_deleted = $${index} , `;
      values.push(is_trash_deleted);
      index++;
    }

    query += "WHERE template_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);
    if (result.rows[0]) {
      res.json({
        message: "File deleted permanently",
        error: false,
      });
    } else {
      res.json({
        message: "Error Occurred",
        error: true,
      });
    }
    // const result = await pool.query('DELETE FROM Files WHERE file_id = $1', [file_id]);
    // res.json({
    //     message: "File deleted permanently",
    //     error: false
    // });
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
// delete all
exports.deleteAllTrashPermanent = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.user_id;
    // Delete files
    await pool.query(
      "DELETE FROM Files WHERE user_id = $1 AND is_deleted = true",
      [user_id]
    );

    // Delete folders
    await pool.query(
      "DELETE FROM Folder WHERE user_id = $1 AND is_deleted = true",
      [user_id]
    );

    res.json({
      message: "Trash emptied successfully",
      error: false,
    });
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

exports.deleteSelectedTrashPermanent = async (req, res) => {
  const client = await pool.connect();
  try {
    const items = req.body.items;

    for (let i = 0; i < items.length; i++) {
      const { item, type } = items[i];

      try {
        if (type === "file") {
          // Delete file
          await pool.query(
            "DELETE FROM Files WHERE file_id = $1 AND is_deleted = true",
            [item]
          );
        } else if (type === "folder") {
          // Delete folder
          await pool.query(
            "DELETE FROM Folder WHERE folder_id = $1 AND is_deleted = true",
            [item]
          );
        }
      } catch (err) {
        console.log(`Error deleting ${type} with id ${item}: ${err.message}`);
        continue;
      }
    }

    res.json({
      message: "Deleted Selected Items successfully",
      error: false,
    });
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
exports.restoreTrash = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.user_id;

    // Restore files
    await pool.query(
      "UPDATE Files SET is_deleted = false WHERE user_id = $1 AND is_deleted = true",
      [user_id]
    );

    // Restore folders
    await pool.query(
      "UPDATE Folder SET is_deleted = false WHERE user_id = $1 AND is_deleted = true",
      [user_id]
    );

    res.json({
      message: "Trash Restored successfully",
      error: false,
    });
  } catch (err) {
    console.log(err);

    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
// restore selected
exports.restoreSelectedTrash = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const items = req.body.items;

    for (let i = 0; i < items.length; i++) {
      const { item, type } = items[i];

      try {
        if (type === "file") {
          // Restore file
          await pool.query(
            "UPDATE Files SET is_deleted = false WHERE file_id = $1 AND is_deleted = true",
            [item]
          );
        } else if (type === "folder") {
          // Restore folder
          await pool.query(
            "UPDATE Folder SET is_deleted = false WHERE folder_id = $1 AND is_deleted = true",
            [item]
          );
        }
      } catch (err) {
        console.log(`Error restoring ${type} with id ${item}: ${err.message}`);
        continue;
      }
    }

    res.json({
      message: "Trash restored successfully",
      error: false,
    });
  } catch (err) {
    console.log(err);

    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
// save canvas
exports.saveCanvasDataWithFile_Id = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { file_id, position_array } = req.body;

    const FileDataCheck = await pool.query(
      "SELECT * FROM files WHERE file_id=$1",
      [file_id]
    );
    if (FileDataCheck.rows.length === 0) {
      res.json({ error: true, data: [], message: "File Doesnot Exist" });
    } else {
      console.log("File Exist");
      const PositionDataCheck = await pool.query(
        "SELECT * FROM positions WHERE file_id=$1",
        [file_id]
      );
      if (PositionDataCheck.rows.length === 0) {
        const userData = await pool.query(
          "INSERT INTO positions(file_id,position_array) VALUES($1,$2) returning *",
          [file_id, position_array]
        );
        // const data = userData.rows[0]
        if (userData.rows.length === 0) {
          res.json({ error: true, data: [], message: "Can't Ad Position" });
        } else {
          res.json({
            error: false,
            data: userData.rows[0],
            message: "Position Added Successfully",
          });
        }
      } else {
        // Position Update

        let query = "UPDATE positions SET ";
        let index = 2;
        let values = [file_id];

        if (position_array) {
          query += `position_array = $${index} , `;
          values.push(position_array);
          index++;
        }

        query += "WHERE file_id = $1 RETURNING*";
        query = query.replace(/,\s+WHERE/g, " WHERE");
        // console.log(query);

        const result = await pool.query(query, values);

        console.log(result);

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
// encrypted file id
exports.saveCanvasDataWithFile_IdSave = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { file_id, position_array } = req.body;
    let decryptedFileId = decryptData(file_id);
    const FileDataCheck = await pool.query(
      "SELECT * FROM files WHERE file_id=$1",
      [decryptedFileId]
    );
    if (FileDataCheck.rows.length === 0) {
      res.json({ error: true, data: [], message: "File Doesnot Exist" });
    } else {
      console.log("File Exist");
      const PositionDataCheck = await pool.query(
        "SELECT * FROM positions WHERE file_id=$1",
        [decryptedFileId]
      );
      if (PositionDataCheck.rows.length === 0) {
        const userData = await pool.query(
          "INSERT INTO positions(file_id,position_array) VALUES($1,$2) returning *",
          [decryptedFileId, position_array]
        );
        // const data = userData.rows[0]
        if (userData.rows.length === 0) {
          res.json({ error: true, data: [], message: "Can't Ad Position" });
        } else {
          res.json({
            error: false,
            data: userData.rows[0],
            message: "Position Added Successfully",
          });
        }
      } else {
        // Position Update

        let query = "UPDATE positions SET ";
        let index = 2;
        let values = [decryptedFileId];

        if (position_array) {
          query += `position_array = $${index} , `;
          values.push(position_array);
          index++;
        }

        query += "WHERE file_id = $1 RETURNING*";
        query = query.replace(/,\s+WHERE/g, " WHERE");
        // console.log(query);

        const result = await pool.query(query, values);

        console.log(result);

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
// update canvas Positions not need
exports.UpdateCanvasDataWithPosition_Id = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { positions_id, height, type, url, width, x, y } = req.body;
    let query = "UPDATE positions SET ";
    let index = 2;
    let values = [positions_id];

    if (height) {
      query += `height = $${index} , `;
      values.push(height);
      index++;
    }
    if (type) {
      query += `type = $${index} , `;
      values.push(type);
      index++;
    }
    if (url) {
      query += `url = $${index} , `;
      values.push(url);
      index++;
    }
    if (width) {
      query += `width = $${index} , `;
      values.push(width);
      index++;
    }
    if (x) {
      query += `xaxis = $${index} , `;
      values.push(x);
      index++;
    }
    if (y) {
      query += `yaxis = $${index} , `;
      values.push(y);
      index++;
    }

    query += "WHERE positions_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);

    console.log(result);

    if (result.rows.length === 0) {
      res.json({ error: true, data: [], message: "Something went wrong" });
    } else {
      res.json({
        error: false,
        data: result.rows,
        message: "Data Updated Successfully",
      });
    }
  } catch (err) {
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};

// get all canvas positions
exports.getallPositionsFromFile_Id = async (req, res) => {
  const client = await pool.connect();
  try {
    const file_id = req.body.file_id;
    if (!file_id) {
      return res.json({
        message: "Please provide File Id",
        error: true,
      });
    }

    const query = "SELECT * FROM positions WHERE file_id = $1 ";
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
      status: false,
      error: err.message,
    });
  } finally {
    client.release();
  }
};
// add signer
exports.addSigner = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { signers, file_id } = req.body; // assuming req.body is an array of signer objects

    // delete previous data first of file id
    // await pool.query("DELETE FROM signer WHERE file_id=$1", [file_id]);
    let resultArray = [];
    console.log(signers);
    for (let i = 0; i < signers.length; i++) {
      const { name, order_id, email, color, access_code } = signers[i];
      // console.log(signers[i])
      // check email from signers array exist or not
      const checkEmail = await pool.query(
        "SELECT * FROM signer WHERE email=$1 AND file_id=$2",

        [email, file_id]
      );
      console.log(checkEmail.rows);
      if (checkEmail.rows.length > 0) {
        console.log("exists");
        // update order_id
        const signerData = await pool.query(
          "UPDATE signer SET order_id = $1 WHERE email = $2 AND file_id = $3 returning *",
          [order_id, email, file_id]
        );
        const data = signerData.rows;
        resultArray.push(data[0]);
        if (data.length === 0) {
          res.json({
            error: true,
            data: [],
            message: "Cant Update Signer Right Now",
          });
          return;
        }

        // res.json({ error: true, data: [], message: "Email Already Exist" });
        // return;
      } else {
        console.log("inserting new");

        const signerData = await pool.query(
          "INSERT INTO signer(file_id,name,email,color,access_code,order_id) VALUES($1,$2,$3,$4,$5,$6) returning *",
          [file_id, name, email, color, access_code || null, order_id]
        );
        const data = signerData.rows;
        resultArray.push(data[0]);
        if (data.length === 0) {
          res.json({
            error: true,
            data: [],
            message: "Cant Create Signer Right Now",
          });
          return;
        }
      }
    }

    res.json({
      error: false,
      data: resultArray,
      message: "Signers Created Successfully",
    });
  } catch (err) {
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};

// update signer access code
exports.updateSigner = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { signer_id, name, email, access_code, completed_status } = req.body;

    // update File Signers
    let query = "UPDATE signer SET ";
    let index = 2;
    let values = [signer_id];
    if (
      access_code === null ||
      access_code === undefined ||
      access_code === ""
    ) {
      query += `access_code = $${index} , `;
      values.push(null);
      index++;
    } else {
      if (access_code) {
        query += `access_code = $${index} , `;
        values.push(access_code);
        index++;
      }
    }

    if (name) {
      query += `name = $${index} , `;
      values.push(name);
      index++;
    }
    if (email) {
      query += `email = $${index} , `;
      values.push(email);
      index++;
    }
    if (completed_status) {
      query += `completed_status = $${index} , `;
      values.push(completed_status);
      index++;
    }

    query += "WHERE signer_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);

    // console.log(result.rows[0])
    let Data = result.rows[0];

    if (result.rows.length === 0) {
      res.json({ error: true, data: [], message: "Could Not Update Record " });
    } else {
      res.json({ error: false, data: Data, message: "Updated Successfully " });
    }
  } catch (err) {
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
// markDocAsCompleted
exports.markDocAsCompletedBySigner = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      signer_id,
      completed_status,
      location_country,
      ip_address,
      location_date,
      url_file,
    } = req.body;
    const completed_at = new Date();
    console.log(url_file);
    // update File Signers
    let query = "UPDATE signer SET ";
    let index = 2;
    let values = [signer_id];

    if (completed_status) {
      query += `completed_status = $${index} , `;
      values.push(completed_status);
      index++;
    }
    if (completed_at) {
      query += `completed_at = $${index} , `;
      values.push(completed_at);
      index++;
    }

    query += "WHERE signer_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);

    // console.log(result.rows[0])
    let Data = result.rows[0];
    // console.log(Data)

    if (result.rows.length === 0) {
      console.log("Status Error ");
      // res.json({ error: true, data: [], message: "Could Not Update Record " });
    } else {
      let file_id = Data.file_id;
      console.log(file_id);
      let currentSignerEmail = Data.name;
      let currentSignerEmailData = Data.email;

      const querySigners =
        "SELECT * FROM signer WHERE file_id = $1 AND completed_status IS NULL";
      const resultSigners = await pool.query(querySigners, [file_id]);
      // receipt
      const queryRecipients = "SELECT * FROM recipient WHERE file_id = $1 ";
      const resultRecipients = await pool.query(queryRecipients, [file_id]);
      // console.log(resultSigners.rows)
      const queryFile = "SELECT * FROM files WHERE file_id = $1 ";
      const resultFile = await pool.query(queryFile, [file_id]);
      let fileData = resultFile.rows[0];
      let sender_user_id = resultFile.rows[0].user_id;
      const queryUserSender = "SELECT * FROM users WHERE user_id = $1 ";
      const resultUserSender = await pool.query(queryUserSender, [
        sender_user_id,
      ]);

      let File_User = resultFile.rows[0].user_id;
      let File_Name_email = resultFile.rows[0].name;
      let sender_email = resultUserSender.rows[0].email;
      let sender_name = `${
        resultUserSender.rows[0].first_name + resultUserSender.rows[0].last_name
      }`;

      let SendEmailSigners = resultSigners.rows;
      let SendEmailRecipients = resultRecipients.rows;

      console.log(SendEmailSigners);

      if (SendEmailSigners.length === 0) {
        let status = "Completed";

        let queryStatus = "UPDATE files SET ";
        let index = 2;
        let valuesFile = [file_id];

        if (status) {
          queryStatus += `status = $${index} , `;
          valuesFile.push(status);
          index++;
        }

        queryStatus += "WHERE file_id = $1 RETURNING*";
        queryStatus = queryStatus.replace(/,\s+WHERE/g, " WHERE");
        const resultStatus = await pool.query(queryStatus, valuesFile);
        if (resultStatus.rows.length === 0) {
          // res.json({ error: true, data: [], message: "Can't Update Data" });
        } else {
          console.log(File_User);
          console.log(fileData);
          console.log("FILE COMPLETED");
          const queryUser = "SELECT * FROM users WHERE user_id = $1 ";
          const resultUser = await pool.query(queryUser, [File_User]);

          const btnText = `Click to View`;
          const first_name = resultUser.rows[0].first_name;
          const last_name = resultUser.rows[0].last_name;
          const email = resultUser.rows[0].email;
          //  audit log FILE
          console.log("COMP");
          console.log(File_User);

          // end audit log FILE
          // const encryptedEmail = encryptData(email);
          // const encryptedId = encryptData(file_id);

          const email_subject = `Completed Document: ${fileData.name}`;
          const email_message = `The file name ${fileData.name}  has been completed by signer(s).`;
          console.log("completed");

          console.log(email);
          const resetLink = `${urls.completedDocument}/${file_id}`;
          console.log(resetLink);
          // SendEmailRecipients
          for (let i = 0; i < SendEmailRecipients.length; i++) {
            // console.log(SendEmailRecipients[i])
            // console.log("Signer")
            // console.log(SendEmailRecipients[i].email)

            const btnText = `Click to View`;
            const first_name = SendEmailRecipients[i].name;
            const last_name = "";
            const email = SendEmailRecipients[i].email;
            const encryptedEmail = encryptData(email);
            const encryptedId = encryptData(file_id);

            const email_subject = `Recipients Alert for File: ${fileData.name}`;
            let linkView = `${urls.urlApid}${url_file}`.replace(/\\/g, "/");
            const email_message = ` The file name <span style="font-weight:700"> ${fileData.name}</span>  has been completed by signer(s).View document by this link <a href="${linkView}">View Document</a>`;
            console.log("recipient");

            console.log(email);
            const resetLink = `${urls.recipientDocument}/${file_id}/${encryptedEmail}`;
            console.log(resetLink);
            SigningEmailtemplate(
              email,
              resetLink,
              first_name,
              last_name,
              email_subject,
              email_message,
              btnText
            );
          }

          // end

          SigningEmailtemplate(
            email,
            resetLink,
            first_name,
            last_name,
            email_subject,
            email_message,
            btnText
          );
          // res.json({ error: false, data: result.rows[0], message: "Data Updated Successfully" });
          // const event_type_file = "COMPLETED-SIGNING-DOCUMENT";
          // const description = `${fileData.name} document created by ${email} completed and signed `;
          // const file_audit_result = await pool.query(
          //   "INSERT INTO file_log(user_id,description,email,file_id,event,location_country,ip_address,location_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *",
          //   [
          //     File_User,
          //     description,
          //     email,
          //     file_id,
          //     event_type_file,
          //     location_country,
          //     ip_address,
          //     location_date,
          //   ]
          // );
          // if (file_audit_result.rows.length === 0) {
          //   console.log("FILE LOG MAINTAIN ERROR SIGN IN");
          // } else {
          //   console.log("FILE SUCCESS LOG SIGN IN ");
          // }
        }
      } else {
        console.log("Signer");

        for (let i = 0; i < SendEmailSigners.length; i++) {
          // console.log(SendEmailSigners[i])
          // console.log("Signer")
          // console.log(SendEmailSigners[i].email)

          const btnText = `Click to View`;
          const first_name = SendEmailSigners[i].name;
          const last_name = "";
          const email = SendEmailSigners[i].email;
          const encryptedEmail = encryptData(email);
          const encryptedId = encryptData(file_id);

          const email_subject = `Signers Alert for File: ${fileData.name}`;
          let linkView = `${urls.urlApid}${url_file}`.replace(/\\/g, "/");
          const email_message = `<span style="font-weight:700;">${currentSignerEmail}</span> with email address <span style="font-weight:700;">${currentSignerEmailData}</span> has signed file name, <span style="font-weight:700;">${File_Name_email}</span>.View Document by this link <a href="${linkView}">View Document</a>`;
          console.log(email);
          const resetLink = `${urls.sendDocToESign}/${encryptedEmail}/${encryptedId}`;
          console.log(resetLink);
          SigningEmailtemplate(
            email,
            resetLink,
            first_name,
            last_name,
            email_subject,
            email_message,
            btnText
          );
        }
      }
      //  audit log FILE
      const event_type_file = "SIGNED-DOC-BY-SIGNER";
      const description = `${currentSignerEmailData} signed a document ${fileData.name} `;
      const file_audit_result = await pool.query(
        "INSERT INTO file_log(user_id,description,email,file_id,event,location_country,ip_address,location_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *",
        [
          File_User,
          description,
          currentSignerEmailData,
          file_id,
          event_type_file,
          location_country,
          ip_address,
          location_date,
        ]
      );
      if (file_audit_result.rows.length === 0) {
        console.log("FILE LOG MAINTAIN ERROR SIGN IN");
      } else {
        console.log("FILE SUCCESS LOG SIGN IN ");
      }
      // end audit log FILE
      res.json({ error: false, data: Data, message: "Updated Successfully " });
    }
  } catch (err) {
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
// make api to update file log
exports.updateFileLog = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      file_id,
      user_id,
      description,
      email,
      event,
      location_country,
      ip_address,
      location_date,
    } = req.body;
    //  audit log FILE
    // const event_type_file = "SIGNED-DOC-BY-SIGNER";
    // const description = `${currentSignerEmailData} signed a document ${fileData.name} `;
    const file_audit_result = await pool.query(
      "INSERT INTO file_log(user_id,description,email,file_id,event,location_country,ip_address,location_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *",
      [
        user_id,
        description,
        email,
        file_id,
        event,
        location_country,
        ip_address,
        location_date,
      ]
    );
    if (file_audit_result.rows.length === 0) {
      console.log("FILE LOG MAINTAIN ERROR SIGN IN");
    } else {
      console.log("FILE SUCCESS LOG SIGN IN ");
    }
  } catch (err) {
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};

// delete signer access code
exports.deleteSigner = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { signer_id } = req.body;
    const deleteUserQuery = await pool.query(
      "DELETE FROM signer WHERE signer_id = $1",
      [signer_id]
    );
    console.log(deleteUserQuery.rows.length);
    if (deleteUserQuery.rows.length === 0) {
      res.json({ error: false, data: [], message: "Deleted Successfully" });
    } else {
      res.json({ error: true, message: "Error in deletion" });
    }
  } catch (err) {
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
exports.deleteRecipient = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { recipient_id } = req.body;
    const deleteUserQuery = await pool.query(
      "DELETE FROM recipient WHERE recipient_id = $1",
      [recipient_id]
    );
    console.log(deleteUserQuery.rows.length);
    if (deleteUserQuery.rows.length === 0) {
      res.json({ error: false, data: [], message: "Deleted Successfully" });
    } else {
      res.json({ error: true, message: "Error in deletion" });
    }
  } catch (err) {
    console.log(err);
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};

// get signers
exports.getAllSignersByFileId = async (req, res) => {
  const client = await pool.connect();
  try {
    const file_id = req.body.file_id;
    if (!file_id) {
      return res.json({
        message: "Please provide File Id",
        error: true,
      });
    }

    const query =
      "SELECT * FROM signer WHERE file_id = $1  ORDER BY order_id ASC";
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
      status: false,
      error: err.message,
    });
  } finally {
    client.release();
  }
};

// add Recipient

exports.addRecipient = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { recipients, file_id } = req.body; // assuming req.body is an array of signer objects

    // delete previous data first of file id
    await pool.query("DELETE FROM recipient WHERE file_id=$1", [file_id]);
    let resultArray = [];
    for (let i = 0; i < recipients.length; i++) {
      const { name, email } = recipients[i];

      const recipientData = await pool.query(
        "INSERT INTO recipient(file_id,name,email) VALUES($1,$2,$3) returning *",
        [file_id, name, email]
      );
      const data = recipientData.rows;
      resultArray.push(data[0]);
      if (data.length === 0) {
        res.json({
          error: true,
          data: [],
          message: "Cant Create Recipient Right Now",
        });
        return;
      }
    }

    res.json({
      error: false,
      data: resultArray,
      message: "Recipients Created Successfully",
    });
  } catch (err) {
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
// get all recipients by file id
exports.getAllRecipientsByFileId = async (req, res) => {
  const client = await pool.connect();
  try {
    const file_id = req.body.file_id;
    if (!file_id) {
      return res.json({
        message: "Please provide File Id",
        error: true,
      });
    }

    const query = "SELECT * FROM recipient WHERE file_id = $1 ";
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
      status: false,
      error: err.message,
    });
  } finally {
    client.release();
  }
};
// send doc for e sign
exports.waitingForMeDocLink = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { file_id, email } = req.body;

    // Convert email and file_id to strings
    const stringEmail = String(email);
    const stringFileId = String(file_id);
    const encryptedEmail = encryptData(stringEmail);
    const encryptedId = encryptData(stringFileId);
    // console.log(email)
    let resetLink = `${urls.sendDocToESign}/${encryptedEmail}/${encryptedId}`;
    res.json({ error: false, data: resetLink, message: "Signer Link View  " });
  } catch (err) {
    console.error(err);
    // Don't send another response if one has already been sent
    res.status(500).json({ error: true, message: "An error occurred" });
  } finally {
    client.release();
  }
};
exports.sendDocToESign = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      file_id,
      name,
      email_subject,
      email_message,
      signer_functional_controls,
      secured_share,
      set_esigning_order,
      location_country,
      ip_address,
      location_date,
      timezone,
    } = req.body;
    console.log(name);
    if (!file_id) {
      return res.json({
        message: "Please provide File Id",
        error: true,
      });
    }

    const query1 = "SELECT * FROM files WHERE file_id = $1 ";
    const result1 = await pool.query(query1, [file_id]);
    let user_id_log = result1.rows[0].user_id;

    const queryUser = "SELECT * FROM users WHERE user_id = $1 ";
    const resultUser = await pool.query(queryUser, [user_id_log]);
    let user_email = resultUser.rows[0].email;
    let user_name_sender = `${
      resultUser.rows[0].first_name + resultUser.rows[0].last_name
    }`;

    const send_esign_at = new Date();
    if (result1.rows.length === 0) {
      res.json({
        message: "No file exist for thid file id ",
        error: false,
        result: result1.rows,
      });
    } else {
      let query = "UPDATE files SET ";
      let index = 2;
      let values = [file_id];

      const status = "WaitingForOthers";

      if (name) {
        query += `name = $${index} , `;
        values.push(name);
        index++;
      }
      if (send_esign_at) {
        query += `send_esign_at = $${index} , `;
        values.push(send_esign_at);
        index++;
      }
      if (email_subject) {
        query += `email_subject = $${index} , `;
        values.push(email_subject);
        index++;
      }
      if (email_message) {
        query += `email_message = $${index} , `;
        values.push(email_message);
        index++;
      }
      if (status) {
        query += `status = $${index} , `;
        values.push(status);
        index++;
      }
      if (signer_functional_controls) {
        query += `signer_functional_controls = $${index} , `;
        values.push(signer_functional_controls);
        index++;
      }
      if (secured_share) {
        query += `secured_share = $${index} , `;
        values.push(secured_share);
        index++;
      }
      if (set_esigning_order) {
        query += `set_esigning_order = $${index} , `;
        values.push(set_esigning_order);
        index++;
      }

      query += "WHERE file_id = $1 RETURNING*";
      query = query.replace(/,\s+WHERE/g, " WHERE");
      const result = await pool.query(query, values);
      // console.log(result.rows[0])

      if (result.rows.length === 0) {
        res.json({
          error: true,
          data: [],
          message: "Could Not Update File Status ",
        });
      } else {
        let Data = result.rows[0];
        res.json({
          error: false,
          data: Data,
          message: "Updated Successfully ",
        });
        //  audit log FILE
        const event_type_file = "DOC-SEND-TO-ESIGN";
        const description = `${user_email} send document ${name} for E-Sign `;
        const file_audit_result = await pool.query(
          "INSERT INTO file_log(user_id,description,email,file_id,event,location_country,ip_address,location_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *",
          [
            user_id_log,
            description,
            user_email,
            file_id,
            event_type_file,
            location_country,
            ip_address,
            location_date,
          ]
        );
        if (file_audit_result.rows.length === 0) {
          console.log("FILE LOG MAINTAIN ERROR SIGN IN");
        } else {
          console.log("FILE SUCCESS LOG SIGN IN ");
        }
        // end audit log FILE

        // Send email
        // get all signers to send email
        // if (set_esigning_order === true || set_esigning_order === "true") {
        const querySigners =
          "SELECT * FROM signer WHERE file_id = $1 ORDER BY order_id ASC";
        const resultSigners = await pool.query(querySigners, [file_id]);
        const SendEmailSigners = resultSigners.rows;
        console.log("SendEmailSigners");
        console.log(SendEmailSigners);
        if (SendEmailSigners.length === 0) {
        } else {
          for (let i = 0; i < SendEmailSigners.length; i++) {
            // console.log(SendEmailSigners[i])
            const btnText = `Click to View`;
            const first_name = SendEmailSigners[i].name;
            const last_name = "";
            const email = SendEmailSigners[i].email;
            const encryptedEmail = encryptData(email);
            const encryptedId = encryptData(file_id);
            const email_subject = Data.email_subject;
            const email_message = Data.email_message;
            // console.log(email)
            const resetLink = `${urls.sendDocToESign}/${encryptedEmail}/${encryptedId}`;
            console.log(email);
            console.log(resetLink);
            SendEsignEmail(
              email,
              resetLink,
              first_name,
              last_name,
              email_subject,
              email_message,
              btnText,
              name,
              user_name_sender,
              user_email
            );

            // SigningEmailtemplate(email, resetLink, first_name, last_name, email_subject, email_message, btnText)
          }
        }
        // } else {

        // }
      }
    }
  } catch (err) {
    console.error(err);
    // Don't send another response if one has already been sent
    if (!res.headersSent) {
      res.status(500).json({ error: true, message: "An error occurred" });
    }
  } finally {
    client.release();
  }
};
exports.recipientLogMaintain = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      receipt_email,
      file_id,
      location_country,
      ip_address,
      location_date,
    } = req.body;
    let decryptedEmail = decryptData(receipt_email);
    const query1 = "SELECT * FROM files WHERE file_id = $1 ";
    const result1 = await pool.query(query1, [file_id]);
    if (result1.rows.length === 0) {
    } else {
      let file_name = result1.rows[0].name;
      const event_type_file = "OPENED-A-DOC";
      const user_id = result1.rows[0].user_id;

      const description = `${decryptedEmail} added as Recipient opened a document ${file_name}  `;
      const file_audit_result = await pool.query(
        "INSERT INTO file_log(user_id,description,email,file_id,event,location_country,ip_address,location_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *",
        [
          user_id,
          description,
          decryptedEmail,
          file_id,
          event_type_file,
          location_country,
          ip_address,
          location_date,
        ]
      );
      if (file_audit_result.rows.length === 0) {
        console.log("FILE LOG MAINTAIN ERROR SIGN IN");
      } else {
        console.log("FILE SUCCESS LOG SIGN IN ");
      }
    }

    // end audit log FILE
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
exports.receivedDocEsign = async (req, res, next) => {
  // Decrypt File Id and email
  const client = await pool.connect();
  try {
    const { email, file_id, location_country, ip_address, location_date } =
      req.body;
    if (!email) {
      return res.json({
        message: "Please provide Email",
        error: true,
        screen: "Invalid",
      });
    }
    if (!file_id) {
      return res.json({
        message: "Please provide File Id",
        error: true,
        screen: "Invalid",
      });
    }
    let decryptedEmail = decryptData(email);
    let decryptedFileId = decryptData(file_id);
    console.log(decryptedEmail);
    console.log(decryptedFileId);
    // check file exist or not for this id
    const query1 = "SELECT * FROM files WHERE file_id = $1 ";
    const result1 = await pool.query(query1, [decryptedFileId]);
    if (result1.rows.length === 0) {
      res.json({
        message: "No file exist for this file id ",
        error: true,
        screen: "DeletedFile",
      });
    } else {
      let fileDetails = result1.rows[0];
      // check signer exist for the file id or not in signer table
      const querySigners =
        "SELECT * FROM signer WHERE file_id = $1 AND email=$2 ";
      const resultSigners = await pool.query(querySigners, [
        decryptedFileId,
        decryptedEmail,
      ]);
      const SendEmailSigners = resultSigners.rows;
      console.log("SendEmailSigners");
      console.log(SendEmailSigners);
      const completed_status = resultSigners.rows[0].completed_status;

      if (SendEmailSigners.length === 0) {
        res.json({
          message: "No Signer Exist for this file id and email",
          error: true,
          screen: "Invalid",
        });
      } else {
        // get bg images
        const queryBgImages = "SELECT * FROM bgimgs WHERE file_id = $1 ";
        const resultBgImages = await pool.query(queryBgImages, [
          decryptedFileId,
        ]);
        const bgImages = resultBgImages.rows;
        console.log("bgImages");
        console.log(bgImages);
        // grt positions by file id
        const queryPositions = "SELECT * FROM positions WHERE file_id = $1 ";
        const resultPositions = await pool.query(queryPositions, [
          decryptedFileId,
        ]);
        const positions = resultPositions.rows;
        console.log("positions");
        console.log(positions);
        // grt All Signers by file id
        const queryAllSign = "SELECT * FROM signer WHERE file_id = $1 ";
        const resultAllSign = await pool.query(queryAllSign, [decryptedFileId]);
        const all_signers = resultAllSign.rows;
        console.log("all_signers");
        console.log(all_signers);
        //  audit log FILE
        if (completed_status === "true" || completed_status === true) {
        } else {
          // const event_type_file = "OPENED-A-DOC";
          // const user_id = fileDetails.user_id;
          // const description = `${decryptedEmail} opened a document ${fileDetails.name} to E-Sign `;
          // const file_audit_result = await pool.query(
          //   "INSERT INTO file_log(user_id,description,email,file_id,event,location_country,ip_address,location_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *",
          //   [
          //     user_id,
          //     description,
          //     decryptedEmail,
          //     decryptedFileId,
          //     event_type_file,
          //     location_country,
          //     ip_address,
          //     location_date,
          //   ]
          // );
          // if (file_audit_result.rows.length === 0) {
          //   console.log("FILE LOG MAINTAIN ERROR SIGN IN");
          // } else {
          //   console.log("FILE SUCCESS LOG SIGN IN ");
          // }
          const event_type_file = "OPENED-A-DOC";
  const user_id = fileDetails.user_id;
  const description = `${decryptedEmail} opened a document ${fileDetails.name} to E-Sign`;

  // First, check if a similar row already exists
  const checkQuery = `
    SELECT * FROM file_log 
    WHERE user_id = $1 AND event = $2 AND email = $3 AND file_id = $4 
    AND location_country = $5 AND ip_address = $6 
  `;
  const checkResult = await pool.query(checkQuery, [
    user_id, event_type_file, decryptedEmail, decryptedFileId, 
    location_country, ip_address
  ]);

  if (checkResult.rows.length === 0) {
    // If no similar row exists, proceed with the insertion
    const insertQuery = `
      INSERT INTO file_log(user_id, description, email, file_id, event, location_country, ip_address, location_date) 
      VALUES($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;
    const file_audit_result = await pool.query(insertQuery, [
      user_id, description, decryptedEmail, decryptedFileId, event_type_file, 
      location_country, ip_address, location_date
    ]);

    if (file_audit_result.rows.length === 0) {
      console.log("FILE LOG MAINTAIN ERROR SIGN IN");
    } else {
      console.log("FILE SUCCESS LOG SIGN IN");
    }
  } else {
    // If a similar row exists, log that the entry already exists
    console.log("Similar file log entry already exists. Skipping insertion.");
  }
          // end audit log FILE
        }

        // res.json({
        //     message: "Signer Exist for this file id and email",
        //     data: SendEmailSigners[0],
        //     fileDetails:fileDetails,
        //     error: false,
        //     screen: "Valid",
        //     bgImages:bgImages
        // })

        // Check Access Code for Signer
        if (SendEmailSigners[0].access_code === null) {
          res.json({
            message: "No Access Code Exist for this file id and email",
            error: false,
            data: SendEmailSigners[0],
            fileDetails: fileDetails,
            bgImages: bgImages,
            positions: positions,
            all_signers: all_signers,
            screen: "Valid",
            accessCode: false,
          });
        } else {
          res.json({
            message: "Signer Exist for this file id and email",
            data: SendEmailSigners[0],
            fileDetails: fileDetails,
            bgImages: bgImages,
            positions: positions,
            all_signers: all_signers,
            error: false,
            screen: "Valid",
            accessCode: true,
          });
        }
      }
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
exports.receivedDocReceipt = async (req, res, next) => {
  // Decrypt File Id and email
  const client = await pool.connect();
  try {
    const { email, file_id } = req.body;
    if (!email) {
      return res.json({
        message: "Please provide Email",
        error: true,
        screen: "Invalid",
      });
    }
    if (!file_id) {
      return res.json({
        message: "Please provide File Id",
        error: true,
        screen: "Invalid",
      });
    }
    let decryptedEmail = decryptData(email);
    let decryptedFileId = decryptData(file_id);
    console.log(decryptedEmail);
    console.log(decryptedFileId);
    // check file exist or not for this id
    const query1 = "SELECT * FROM files WHERE file_id = $1 ";
    const result1 = await pool.query(query1, [decryptedFileId]);
    if (result1.rows.length === 0) {
      res.json({
        message: "No file exist for this file id ",
        error: true,
        screen: "DeletedFile",
      });
    } else {
      let fileDetails = result1.rows[0];
      // check signer exist for the file id or not in signer table
      const querySigners =
        "SELECT * FROM recipient WHERE file_id = $1 AND email=$2 ";
      const resultSigners = await pool.query(querySigners, [
        decryptedFileId,
        decryptedEmail,
      ]);
      const SendEmailSigners = resultSigners.rows;
      console.log("SendEmailSigners");
      console.log(SendEmailSigners);

      if (SendEmailSigners.length === 0) {
        res.json({
          message: "No Recipients Exist for this file id and email",
          error: true,
          screen: "Invalid",
        });
      } else {
        // get bg images
        const queryBgImages = "SELECT * FROM bgimgs WHERE file_id = $1 ";
        const resultBgImages = await pool.query(queryBgImages, [
          decryptedFileId,
        ]);
        const bgImages = resultBgImages.rows;
        console.log("bgImages");
        console.log(bgImages);
        // grt positions by file id
        const queryPositions = "SELECT * FROM positions WHERE file_id = $1 ";
        const resultPositions = await pool.query(queryPositions, [
          decryptedFileId,
        ]);
        const positions = resultPositions.rows;
        console.log("positions");
        console.log(positions);
        // grt All Signers by file id
        const queryAllSign = "SELECT * FROM signer WHERE file_id = $1 ";
        const resultAllSign = await pool.query(queryAllSign, [decryptedFileId]);
        const all_signers = resultAllSign.rows;
        console.log("all_signers");
        console.log(all_signers);

        // res.json({
        //     message: "Signer Exist for this file id and email",
        //     data: SendEmailSigners[0],
        //     fileDetails:fileDetails,
        //     error: false,
        //     screen: "Valid",
        //     bgImages:bgImages
        // })

        // Check Access Code for Signer
        // if (SendEmailSigners[0].access_code === null) {
        //     res.json({
        //         message: "No Access Code Exist for this file id and email",
        //         error: false,
        //         data: SendEmailSigners[0],
        //         fileDetails: fileDetails,
        //         bgImages: bgImages,
        //         positions: positions,
        //         all_signers: all_signers,
        //         screen: "Valid",
        //         accessCode: false
        //     })
        // } else {
        res.json({
          message: "Recipient Exist for this file id and email",
          data: SendEmailSigners[0],
          fileDetails: fileDetails,
          bgImages: bgImages,
          positions: positions,
          all_signers: all_signers,
          error: false,
          // screen: "Valid",
          // accessCode: true
        });
        // }
      }
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

exports.getbgImagesByFileId = async (req, res) => {
  const client = await pool.connect();
  try {
    const file_id = req.body.file_id;
    if (!file_id) {
      return res.json({
        message: "Please provide File id",
        error: true,
      });
    }

    const query = "SELECT * FROM bgimgs WHERE file_id = $1";
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

// end

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ error: true, message: "No file uploaded." });
    }

    const { path: tempFilePath, originalname: originalFileName } = req.file;
    const imagesDir = path.join(__dirname, "uploads", uuidv4()); // Create a unique directory to store the images

    // Convert PDF to Images
    const pdfOptions = {
      type: "png", // Convert to PNG format
      size: 1024, // Resize image size (you can adjust this value)
    };

    const pdf2imgOptions = {
      type: pdfOptions.type,
      size: pdfOptions.size,
      density: 600, // Image density (you can adjust this value)
    };

    const convertedImages = await promisify(pdf2img.convert)(
      tempFilePath,
      pdf2imgOptions
    );
    const imagePaths = convertedImages.map((image) => image.path);

    // Save the image paths to PostgreSQL
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const imagePath of imagePaths) {
        await client.query("INSERT INTO images (path) VALUES ($1)", [
          imagePath,
        ]);
      }

      await client.query("COMMIT");

      // Clean up temporary files (uploaded PDF and extracted images)
      await unlinkAsync(tempFilePath);
      for (const image of convertedImages) {
        await unlinkAsync(image.path);
      }

      return res.status(200).json({
        error: false,
        data: {
          imagePaths,
          imageCount: imagePaths.length,
        },
        message: "PDF processed successfully.",
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error processing PDF:", err);
      return res
        .status(500)
        .json({ error: true, data: [], message: err.message });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error processing PDF:", err);
    return res
      .status(500)
      .json({ error: true, data: [], message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const client = await pool.connect();
  try {
    const Folder_id = req.body.folder_id;
    const folder_name = req.body.folder_name;
    let query = "UPDATE Folder SET ";
    let index = 2;
    let values = [Folder_id];

    if (folder_name) {
      query += `folder_name = $${index} , `;
      values.push(folder_name);
      index++;
    }

    query += "WHERE folder_id = $1 RETURNING*";
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








// exports.getAllFolders = async (req, res) => {
//   const client = await pool.connect();
//   try {
//     const User_id = req.body.user_id;
//     const Subfolder = req.body.subFolder;
//     const subFolder_id = req.body.subFolder_id;
//     const status = req.body.status;
//     if (!User_id) {
//       return res.json({
//         message: "Please provide User_Id",
//         error: true,
//       });
//     }
//     if (status === "WaitingForMe") {
//       const UserEmailCheck = await pool.query(
//         "SELECT * FROM users WHERE user_id=$1",
//         [User_id]
//       );
//       if (UserEmailCheck.rows.length === 0) {
//         console.log("error");
//       } else {
//         const user_email = UserEmailCheck.rows[0].email;
//         console.log(user_email);
//         console.log("WaitingForMe");
//         const query = `
//   SELECT Files.*
//   FROM Files
//   JOIN signer ON Files.file_id::TEXT = signer.file_id
//   WHERE signer.email = $1
//   AND (signer.completed_status = 'false' OR signer.completed_status IS NULL)
//   ORDER BY Files.created_at DESC
// `;
//         const values = [user_email]; // Assuming user_id is the email

//         const result1 = await client.query(query, values);
//         if (result1.rows.length === 0) {
//           console.log("error");
//           res.json({
//             message: "No Data Found",
//             error: true,
//           });
//         } else {
//           console.log(result1.rows);
//           res.json({
//             message: " Data Found ",
//             error: false,
//             result: result1.rows,
//           });
//         }
//       }
//     } else {
//       // const UserEmailCheck = await pool.query(
//       //   "SELECT * FROM users WHERE user_id=$1",
//       //   [User_id]
//       // );
//       // let userDetails=UserEmailCheck.rows[0].company_id;
//       // if(userDetails){


//       // }
//       if (Subfolder) {
//         if (
//           subFolder_id === null ||
//           subFolder_id === undefined ||
//           subFolder_id === ""
//         ) {
//           return res.json({
//             message: "Please provide Folder_id",
//             error: true,
//           });
//         } else {
//           //update folder name and id
//           // Build the SQL query based on the provided parameters
//           let baseQuery =
//             "SELECT * FROM Files WHERE user_id = $1 AND subFolder_id = $2 AND is_deleted = false AND is_archieved = false";
//           let params = [User_id, subFolder_id];

//           // Check if the status parameter is provided
//           if (status !== null && status !== undefined) {
//             // If status is provided, add it to the query and parameters
//             baseQuery += " AND status = $3";
//             params.push(status);
//           }
//           baseQuery += " ORDER BY created_at DESC";
//           // Execute the query with the dynamic SQL and parameters
//           const result = await pool.query(baseQuery, params);

//           // const query = 'SELECT * FROM Folder WHERE user_id = $1 AND subFolder_id = $2 AND status = $3';
//           // const result = await pool.query(query, [User_id, subFolder_id, status]);
//           if (result.rows.length > 0) {
//             res.json({
//               message: " Data Found ",
//               error: false,
//               result: result.rows,
//             });
//           } else {
//             res.json({
//               message: "No Data Found",
//               error: true,
//             });
//           }
//         }
//       } else {
//         let query =
//           "SELECT * FROM Files WHERE user_id = $1 AND subFolder = $2 AND is_deleted = false AND is_archieved = false";
//         let values = [User_id, Subfolder];

//         if (status !== null && status !== undefined) {
//           query += " AND status = $3";
//           values.push(status);
//         }
//         query += " ORDER BY created_at DESC";
//         // const query = 'SELECT * FROM Files WHERE user_id = $1 AND subFolder = $2 AND status=$3';
//         const result = await pool.query(query, values);
//         //    console.log(result)
//         let result1 = [];
//         if (status === "WaitingForOthers") {
//           console.log("waiti");

//           let query1 =
//             "SELECT * FROM template_responses WHERE user_id = $1 AND completed = $2 ORDER BY created_at DESC";
//           let values1 = [User_id, false || "false"];
//           result1 = await pool.query(query1, values1);
//         } else if (status === "Completed") {
//           console.log("comapl");
//           const CompleteDat = "true";
//           let query1 =
//             "SELECT * FROM template_responses WHERE user_id = $1 AND completed = $2 ORDER BY created_at DESC ";
//           let values1 = [User_id, true || CompleteDat];
//           result1 = await pool.query(query1, values1);
//           console.log(result1.rows);
//         }
//         if (result.rows.length > 0) {
//           res.json({
//             message: "Data Found ",
//             error: false,
//             result: result.rows,
//             result1: result1.rows,
//           });
//         } else {
//           res.json({
//             message: "No Data Found",
//             error: true,
//           });
//         }
//       }
//     }
//   } catch (err) {
//     console.log(err);
//     res.json({
//       message: "Error Occurred",
//       status: false,
//       error: true,
//     });
//   } finally {
//     client.release();
//   }
// };





// -----
// Function to handle the case when status is 'WaitingForMe'
async function handleWaitingForMeStatus(User_id, client) {
  const UserEmailCheck = await pool.query(
    "SELECT * FROM users WHERE user_id=$1",
    [User_id]
  );
  if (UserEmailCheck.rows.length === 0) {
    console.log("error");
    return {
      message: "No Data Found",
      error: true,
    };
  } else {
    const user_email = UserEmailCheck.rows[0].email;
    console.log(user_email);
    console.log("WaitingForMe");
    const query = `
      SELECT Files.*
      FROM Files
      JOIN signer ON Files.file_id::TEXT = signer.file_id
      WHERE signer.email = $1
      AND (signer.completed_status = 'false' OR signer.completed_status IS NULL)
      ORDER BY Files.created_at DESC
    `;
    const values = [user_email]; // Assuming user_id is the email

    const result1 = await client.query(query, values);
    if (result1.rows.length === 0) {
      console.log("error");
      return {
        message: "No Data Found",
        error: true,
      };
    } else {
      console.log(result1.rows);
      return {
        message: " Data Found ",
        error: false,
        result: result1.rows,
      };
    }
  }
}

// Function to handle the case when Subfolder is provided
async function handleSubfolder(User_id, subFolder_id, status) {
  if (
    subFolder_id === null ||
    subFolder_id === undefined ||
    subFolder_id === ""
  ) {
    return {
      message: "Please provide Folder_id",
      error: true,
    };
  } else {
    //update folder name and id
    // Build the SQL query based on the provided parameters
    let baseQuery =
      "SELECT * FROM Files WHERE user_id = $1 AND subFolder_id = $2 AND is_deleted = false AND is_archieved = false";
    let params = [User_id, subFolder_id];

    // Check if the status parameter is provided
    if (status !== null && status !== undefined) {
      // If status is provided, add it to the query and parameters
      baseQuery += " AND status = $3";
      params.push(status);
    }
    baseQuery += " ORDER BY created_at DESC";
    // Execute the query with the dynamic SQL and parameters
    const result = await pool.query(baseQuery, params);

    if (result.rows.length > 0) {
      return {
        message: " Data Found ",
        error: false,
        result: result.rows,
      };
    } else {
      return {
        message: "No Data Found",
        error: true,
      };
    }
  }
}

// Function to handle the case when Subfolder is not provided
async function handleNoSubfolder(User_id, Subfolder, status) {
  let query =
    "SELECT * FROM Files WHERE user_id = $1 AND subFolder = $2 AND is_deleted = false AND is_archieved = false";
  let values = [User_id, Subfolder];

  if (status !== null && status !== undefined) {
    query += " AND status = $3";
    values.push(status);
  }
  query += " ORDER BY created_at DESC";
  const result = await pool.query(query, values);

  let result1 = [];
  if (status === "WaitingForOthers") {
    console.log("waiti");

    let query1 =
      "SELECT * FROM template_responses WHERE user_id = $1 AND completed = $2 ORDER BY created_at DESC";
    let values1 = [User_id, false || "false"];
    result1 = await pool.query(query1, values1);
  } else if (status === "Completed") {
    console.log("comapl");
    const CompleteDat = "true";
    let query1 =
      "SELECT * FROM template_responses WHERE user_id = $1 AND completed = $2 ORDER BY created_at DESC ";
    let values1 = [User_id, true || CompleteDat];
    result1 = await pool.query(query1, values1);
    console.log(result1.rows);
  }
  if (result.rows.length > 0) {
    return {
      message: "Data Found ",
      error: false,
      result: result.rows,
      result1: result1.rows,
    };
  } else {
    return {
      message: "No Data Found",
      error: true,
    };
  }
}

// The main function
exports.getAllFolders = async (req, res) => {
  const client = await pool.connect();
  try {
    const User_id = req.body.user_id;
    const Subfolder = req.body.subFolder;
    const subFolder_id = req.body.subFolder_id;
    const status = req.body.status;
    if (!User_id) {
      return res.json({
        message: "Please provide User_Id",
        error: true,
      });
    }
    if (status === "WaitingForMe") {
      const result = await handleWaitingForMeStatus(User_id, client);
      res.json(result);
    } else if (Subfolder) {
      const result = await handleSubfolder(User_id, subFolder_id, status);
      res.json(result);
    } else {
      const result = await handleNoSubfolder(User_id, Subfolder, status);
      res.json(result);
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      status: false,
      error: true,
    });
  } finally {
    client.release();
  }
};





exports.getAllFilesTemp = async (req, res) => {
  const client = await pool.connect();
  try {
    const User_id = req.body.user_id;

    if (!User_id) {
      return res.json({
        message: "Please provide User_Id",
        error: true,
      });
    }

    let query = "SELECT * FROM template WHERE user_id = $1 ";
    let values = [User_id];

    query += " ORDER BY created_at DESC";
    // const query = 'SELECT * FROM Files WHERE user_id = $1 AND subFolder = $2 AND status=$3';
    const result = await pool.query(query, values);
    //    console.log(result)
    if (result.rows.length > 0) {
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
      error: true,
    });
  } finally {
    client.release();
  }
};
// get all files where user added as signer by email
exports.getAllFilesBySignerEmail = async (req, res) => {
  const client = await pool.connect();
  try {
    const email = req.body.email;
    if (!email) {
      return res.json({
        message: "Please provide Email",
        error: true,
      });
    }
    // Build the SQL query
    const query = `
    SELECT Files.* 
    FROM Files 
    JOIN signer ON Files.file_id = signer.file_id 
    WHERE signer.email = $1
`;

    // Execute the query
    const result = await pool.query(query, [email]);
    if (result.rows.length > 0) {
      res.json({
        message: "Data Found",
        error: false,
        result: result.rows,
      });
    } else {
      res.json({
        message: "No Data Found",
        error: true,
        result: [],
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

exports.getTrashFiles = async (req, res) => {
  const client = await pool.connect();
  try {
    const User_id = req.body.user_id;
    const Subfolder = req.body.subFolder;
    const subFolder_id = req.body.subFolder_id;
    const status = req.body.status;
    if (!User_id) {
      return res.json({
        message: "Please provide User_Id",
        status: false,
      });
    }
    if (Subfolder) {
      if (
        subFolder_id === null ||
        subFolder_id === undefined ||
        subFolder_id === ""
      ) {
        return res.json({
          message: "Please provide Folder_id",
          status: false,
        });
      } else {
        //update folder name and id
        // Build the SQL query based on the provided parameters
        let baseQuery =
          "SELECT * FROM Files WHERE user_id = $1 AND subFolder_id = $2 AND is_deleted = true  AND is_trash_deleted = false";
        let params = [User_id, subFolder_id];

        // Check if the status parameter is provided
        if (status !== null && status !== undefined) {
          // If status is provided, add it to the query and parameters
          baseQuery += " AND status = $3";
          params.push(status);
        }
        baseQuery += " ORDER BY created_at DESC";
        // Execute the query with the dynamic SQL and parameters
        const result = await pool.query(baseQuery, params);

        // const query = 'SELECT * FROM Folder WHERE user_id = $1 AND subFolder_id = $2 AND status = $3';
        // const result = await pool.query(query, [User_id, subFolder_id, status]);
        if (result.rows.length > 0) {
          res.json({
            message: " Data Found ",
            error: false,
            result: result.rows,
          });
        } else {
          res.json({
            message: "No Data Found",
            error: true,
          });
        }
      }
    } else {
      let query =
        "SELECT * FROM Files WHERE user_id = $1 AND subFolder = $2 AND is_deleted = true  AND is_trash_deleted = false";
      let values = [User_id, Subfolder];

      if (status !== null && status !== undefined) {
        query += " AND status = $3";
        values.push(status);
      }
      query += " ORDER BY created_at DESC";
      // const query = 'SELECT * FROM Files WHERE user_id = $1 AND subFolder = $2 AND status=$3';
      const result = await pool.query(query, values);
      //    console.log(result)
      let query1 =
        "SELECT * FROM template WHERE user_id = $1  AND is_deleted = true  AND is_trash_deleted = false";
      let values1 = [User_id];
      query1 += " ORDER BY created_at DESC";
      // const query = 'SELECT * FROM Files WHERE user_id = $1 AND subFolder = $2 AND status=$3';
      const result1 = await pool.query(query1, values1);

      if (result.rows.length >= 0) {
        res.json({
          message: "Data Found ",
          error: false,
          result: result.rows,
          result1: result1.rows,
        });
      } else {
        res.json({
          message: "No Data Found",
          error: true,
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      status: false,
      error: true,
    });
  } finally {
    client.release();
  }
};
// get is_trash_deleted true files ,folders and templates
exports.getPermannentDeletedFiles = async (req, res) => {
  const client = await pool.connect();
  try {
    const User_id = req.body.user_id;
    const Subfolder = req.body.subFolder;
    const subFolder_id = req.body.subFolder_id;
    const status = req.body.status;
    if (!User_id) {
      return res.json({
        message: "Please provide User_Id",
        status: false,
      });
    }
    if (Subfolder) {
      if (
        subFolder_id === null ||
        subFolder_id === undefined ||
        subFolder_id === ""
      ) {
        return res.json({
          message: "Please provide Folder_id",
          status: false,
        });
      } else {
        //update folder name and id
        // Build the SQL query based on the provided parameters
        let baseQuery =
          "SELECT * FROM Files WHERE user_id = $1 AND subFolder_id = $2 AND is_trash_deleted = true";
        let params = [User_id, subFolder_id];

        // Check if the status parameter is provided
        if (status !== null && status !== undefined) {
          // If status is provided, add it to the query and parameters
          baseQuery += " AND status = $3";
          params.push(status);
        }
        baseQuery += " ORDER BY created_at DESC";
        // Execute the query with the dynamic SQL and parameters
        const result = await pool.query(baseQuery, params);

        // const query = 'SELECT * FROM Folder WHERE user_id = $1 AND subFolder_id = $2 AND status = $3';
        // const result = await pool.query(query, [User_id, subFolder_id, status]);
        if (result.rows.length > 0) {
          res.json({
            message: " Data Found ",
            error: false,
            result: result.rows,
          });
        } else {
          res.json({
            message: "No Data Found",
            error: true,
          });
        }
      }
    } else {
      let query =
        "SELECT * FROM Files WHERE user_id = $1 AND subFolder = $2 AND is_trash_deleted = true";
      let values = [User_id, Subfolder];

      if (status !== null && status !== undefined) {
        query += " AND status = $3";
        values.push(status);
      }
      query += " ORDER BY created_at DESC";
      // const query = 'SELECT * FROM Files WHERE user_id = $1 AND subFolder = $2 AND status=$3';
      const result = await pool.query(query, values);
      //    console.log(result)
      let query1 =
        "SELECT * FROM template WHERE user_id = $1  AND is_trash_deleted = true";
      let values1 = [User_id];
      query1 += " ORDER BY created_at DESC";
      // const query = 'SELECT * FROM Files WHERE user_id = $1 AND subFolder = $2 AND status=$3';
      const result1 = await pool.query(query1, values1);

      if (result.rows.length >= 0) {
        res.json({
          message: "Data Found ",
          error: false,
          result: result.rows,
          result1: result1.rows,
        });
      } else {
        res.json({
          message: "No Data Found",
          error: true,
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      status: false,
      error: true,
    });
  } finally {
    client.release();
  }
};

exports.getArchieveFiles = async (req, res) => {
  const client = await pool.connect();
  try {
    const User_id = req.body.user_id;
    const Subfolder = req.body.subFolder;
    const subFolder_id = req.body.subFolder_id;
    const status = req.body.status;
    if (!User_id) {
      return res.json({
        message: "Please provide User_Id",
        status: false,
      });
    }
    if (Subfolder) {
      if (
        subFolder_id === null ||
        subFolder_id === undefined ||
        subFolder_id === ""
      ) {
        return res.json({
          message: "Please provide Folder_id",
          status: false,
        });
      } else {
        //update folder name and id
        // Build the SQL query based on the provided parameters
        let baseQuery =
          "SELECT * FROM Files WHERE user_id = $1 AND subFolder_id = $2 AND is_archieved = true AND is_deleted = false ";
        let params = [User_id, subFolder_id];

        // Check if the status parameter is provided
        if (status !== null && status !== undefined) {
          // If status is provided, add it to the query and parameters
          baseQuery += " AND status = $3";
          params.push(status);
        }
        baseQuery += " ORDER BY created_at DESC";
        // Execute the query with the dynamic SQL and parameters
        const result = await pool.query(baseQuery, params);

        // const query = 'SELECT * FROM Folder WHERE user_id = $1 AND subFolder_id = $2 AND status = $3';
        // const result = await pool.query(query, [User_id, subFolder_id, status]);
        if (result.rows.length > 0) {
          res.json({
            message: " Data Found ",
            error: false,
            result: result.rows,
          });
        } else {
          res.json({
            message: "No Data Found",
            error: true,
          });
        }
      }
    } else {
      let query =
        "SELECT * FROM Files WHERE user_id = $1 AND subFolder = $2 AND is_archieved = true AND is_deleted = false ";
      let values = [User_id, Subfolder];

      if (status !== null && status !== undefined) {
        query += " AND status = $3";
        values.push(status);
      }
      query += " ORDER BY created_at DESC";
      // const query = 'SELECT * FROM Files WHERE user_id = $1 AND subFolder = $2 AND status=$3';
      const result = await pool.query(query, values);
      //    console.log(result)
      if (result.rows.length > 0) {
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
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      status: false,
      error: true,
    });
  } finally {
    client.release();
  }
};
exports.deleteFolders = async (req, res) => {
  const folderId = req.body.folder_id; // Assuming the folder ID is passed as a URL parameter

  const client = await pool.connect();
  try {
    // Check if the folder exists before attempting to delete
    const checkQuery = "SELECT * FROM Folder WHERE folder_id = $1";
    const checkResult = await pool.query(checkQuery, [folderId]);

    if (checkResult.rows.length === 0) {
      // Folder not found, return an error response
      res.status(404).json({
        message: "Folder not found",
        status: false,
      });
    } else {
      // Folder found, proceed with deletion
      const deleteQuery = "DELETE FROM Folder WHERE folder_id = $1";
      await pool.query(deleteQuery, [folderId]);

      res.json({
        message: "Folder deleted successfully",
        status: true,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error occurred",
      status: false,
      error: err.message,
    });
  } finally {
    client.release();
  }
};
exports.updateStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const Folder_id = req.body.folder_id;
    const status = req.body.status;
    let query = "UPDATE Folder SET ";
    let index = 2;
    let values = [Folder_id];

    if (status) {
      query += `status = $${index} , `;
      values.push(status);
      index++;
    }

    query += "WHERE folder_id = $1 RETURNING*";
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
