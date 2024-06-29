const { pool } = require("../../config/db.config");
const crypto = require("crypto");
var nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");

// Define a function to recursively fetch folder hierarchy
async function fetchFolderHierarchy(folderId, foldersMap) {
  if (!folderId || !foldersMap.has(folderId)) {
    return "";
  }

  const folder = foldersMap.get(folderId);
  const parentFolderId = folder.subfolder_id;

  // Recursively fetch parent folder hierarchy
  const parentHierarchy = await fetchFolderHierarchy(
    parentFolderId,
    foldersMap
  );

  // Concatenate folder names with '/' separator
  return parentHierarchy + (parentHierarchy ? "/" : "") + folder.folder_name;
}
exports.createFolder = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      user_id,
      folder_name,
      subFolder,
      subFolder_id,
      color,
      status,
     
    } = req.body;
    const userDataCheck = await pool.query(
      "SELECT * FROM users WHERE user_id=$1",
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
            "INSERT INTO Folder(user_id,folder_name,uniq_id,subFolder,subFolder_id,status,color,is_deleted,is_archieved,is_trash_deleted) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *",
            [
              user_id,
              folder_name,
              uuidv4(),
              subFolder,
              subFolder_id,
              "InProgress",
              color,
              false,
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
          "INSERT INTO Folder(user_id,folder_name,uniq_id,subFolder,subFolder_id,status,color,is_deleted,is_archieved,is_trash_deleted) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *",
          [
            user_id,
            folder_name,
            uuidv4(),
            subFolder,
            null,
            "InProgress",
            color,
            false,
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

exports.updateProfile = async (req, res) => {
  const client = await pool.connect();
  try {
    const Folder_id = req.body.folder_id;
    const folder_name = req.body.folder_name;
    const folderData = await pool.query(
      "SELECT * FROM Folder WHERE folder_id = $1",
      [Folder_id]
    );
    let user_id_log = folderData.rows[0].user_id;
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
    if (Subfolder === true || Subfolder === "true") {
      if (
        subFolder_id === null ||
        subFolder_id === undefined ||
        subFolder_id === ""
      ) {
        return res.json({
          message: "Please provide Folder_id",
          error: true,
        });
      } else {
        let baseQuery =
          "SELECT * FROM Folder WHERE user_id = $1 AND subFolder_id = $2 AND is_deleted = false AND is_archieved = false ORDER BY created_at DESC";
        let params = [User_id, subFolder_id];

        // Check if the status parameter is provided
        if (status !== undefined) {
          // If status is provided, add it to the query and parameters
          baseQuery += " AND status = $3";
          params.push(status);
        }

        // Execute the query with the dynamic SQL and parameters
        const result = await pool.query(baseQuery, params);
        if (result.rows.length === 0) {
          res.json({
            message: "No Data Found",
            error: true,
            result: [],
          });
        } else {
          res.json({
            message: " Data Found ",
            error: false,
            result: result.rows,
          });
        }
      }
    } else {
      let query =
        "SELECT * FROM Folder WHERE user_id = $1 AND subFolder = $2 AND is_deleted = false AND is_archieved = false ORDER BY created_at DESC";
      let params = [User_id, Subfolder];
      // Check if the status parameter is provided
      if (status !== undefined) {
        query += " AND status = $3";
        params.push(status);
      }
      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        res.json({
          message: "No Data Found",
          error: true,
          result: [],
        });
      } else {
        res.json({
          message: "Data Found ",
          error: false,
          result: result.rows,
        });
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
// get All Folders by User id

exports.getAllFoldersByUserIds = async (req, res) => {
  const client = await pool.connect();
  // try {
  //     const User_id = req.body.user_id;

  //     if (!User_id) {
  //         return (
  //             res.json({
  //                 message: "Please provide User_Id",
  //                 error: true
  //             })
  //         )
  //     }

  //         let query = 'SELECT * FROM Folder WHERE user_id = $1  AND is_deleted = false AND is_archieved = false ORDER BY created_at DESC';
  //         let params = [User_id];
  //         // Check if the status parameter is provided

  //         const result = await pool.query(query,params);

  //         if (result.rows.length===0) {
  //             res.json({
  //                 message: "No Data Found",
  //                 error: true,
  //                 result:[]
  //             })
  //         }
  //         else {
  //             res.json({
  //                 message: "Data Found ",
  //                 error: false,
  //                 result: result.rows
  //             })

  //         }

  // }
  try {
    const User_id = req.body.user_id;

    if (!User_id) {
      return res.json({
        message: "Please provide User_Id",
        error: true,
      });
    }

    let query =
      "SELECT * FROM Folder WHERE user_id = $1 AND is_deleted = false AND is_archieved = false ORDER BY created_at DESC";
    let params = [User_id];

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      res.json({
        message: "No Data Found",
        error: true,
        result: [],
      });
    } else {
      // Create a map of folders for efficient retrieval
      const foldersMap = new Map(
        result.rows.map((folder) => [folder.uniq_id, folder])
      );

      // Iterate over each folder and fetch its hierarchy
      for (const folder of result.rows) {
        folder.location = await fetchFolderHierarchy(
          folder.subfolder_id,
          foldersMap
        );
      }

      res.json({
        message: "Data Found ",
        error: false,
        result: result.rows,
      });
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
exports.getAllFoldersTrash = async (req, res) => {
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
    if (Subfolder === true || Subfolder === "true") {
      if (
        subFolder_id === null ||
        subFolder_id === undefined ||
        subFolder_id === ""
      ) {
        return res.json({
          message: "Please provide Folder_id",
          error: true,
        });
      } else {
        let baseQuery =
          "SELECT * FROM Folder WHERE user_id = $1 AND subFolder_id = $2 AND is_deleted = true AND is_trash_deleted = false ORDER BY created_at DESC";
        let params = [User_id, subFolder_id];

        // Check if the status parameter is provided
        if (status !== undefined) {
          // If status is provided, add it to the query and parameters
          baseQuery += " AND status = $3";
          params.push(status);
        }

        // Execute the query with the dynamic SQL and parameters
        const result = await pool.query(baseQuery, params);
        if (result.rows.length === 0) {
          res.json({
            message: "No Data Found",
            error: true,
            result: [],
          });
        } else {
          res.json({
            message: " Data Found ",
            error: false,
            result: result.rows,
          });
        }
      }
    } else {
      let query =
        "SELECT * FROM Folder WHERE user_id = $1 AND subFolder = $2 AND is_deleted = true AND is_trash_deleted = false ORDER BY created_at DESC";
      let params = [User_id, Subfolder];
      // Check if the status parameter is provided
      if (status !== undefined) {
        query += " AND status = $3";
        params.push(status);
      }
      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        res.json({
          message: "No Data Found",
          error: true,
          result: [],
        });
      } else {
        res.json({
          message: "Data Found ",
          error: false,
          result: result.rows,
        });
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
exports.getAllFoldersArchieve = async (req, res) => {
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
    if (Subfolder === true || Subfolder === "true") {
      if (
        subFolder_id === null ||
        subFolder_id === undefined ||
        subFolder_id === ""
      ) {
        return res.json({
          message: "Please provide Folder_id",
          error: true,
        });
      } else {
        let baseQuery =
          "SELECT * FROM Folder WHERE user_id = $1 AND subFolder_id = $2 AND is_archieved = true AND is_deleted = false ORDER BY created_at DESC";
        let params = [User_id, subFolder_id];

        // Check if the status parameter is provided
        if (status !== undefined) {
          // If status is provided, add it to the query and parameters
          baseQuery += " AND status = $3";
          params.push(status);
        }

        // Execute the query with the dynamic SQL and parameters
        const result = await pool.query(baseQuery, params);
        if (result.rows.length === 0) {
          res.json({
            message: "No Data Found",
            error: true,
            result: [],
          });
        } else {
          res.json({
            message: " Data Found ",
            error: false,
            result: result.rows,
          });
        }
      }
    } else {
      let query =
        "SELECT * FROM Folder WHERE user_id = $1 AND subFolder = $2 AND is_archieved = true AND is_deleted = false  ORDER BY created_at DESC";
      let params = [User_id, Subfolder];
      // Check if the status parameter is provided
      if (status !== undefined) {
        query += " AND status = $3";
        params.push(status);
      }
      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        res.json({
          message: "No Data Found",
          error: true,
          result: [],
        });
      } else {
        res.json({
          message: "Data Found ",
          error: false,
          result: result.rows,
        });
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

// delete folder trash
exports.deleteFolders = async (req, res) => {

  const folderId = req.body.folder_id; // Assuming the folder ID is passed as a URL parameter
  const client = await pool.connect();
  try {
    // Check if the folder exists before attempting to delete
    const checkQuery = "SELECT * FROM Folder WHERE folder_id = $1";
    const checkResult = await pool.query(checkQuery, [folderId]);
    let user_id=checkResult.rows[0].user_id
    if (checkResult.rows.length === 0) {
      // Folder not found, return an error response
      res.status(404).json({
        message: "Folder not found",
        error: true,
      });
    } else {
      // Folder found, proceed with deletion
      const deleteQuery =
        "UPDATE Folder SET is_deleted = true, deleted_at = NOW() WHERE folder_id = $1";
      await pool.query(deleteQuery, [folderId]);
      // const deleteQuery = 'DELETE FROM Folder WHERE folder_id = $1';
      // await pool.query(deleteQuery, [folderId]);

// end audit log
      res.json({
        message: "Folder deleted successfully",
        error: false,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error occurred",
      error: true,
      // error: err.message
    });
  } finally {
    client.release();
  }
};
// Archieve folder
exports.ArchieveFolders = async (req, res) => {
  const folderId = req.body.folder_id; // Assuming the folder ID is passed as a URL parameter
  const client = await pool.connect();
  try {
    // Check if the folder exists before attempting to delete
    const checkQuery = "SELECT * FROM Folder WHERE folder_id = $1";
    const checkResult = await pool.query(checkQuery, [folderId]);
   let user_idLog=checkResult.rows[0].user_id
    if (checkResult.rows.length === 0) {
      // Folder not found, return an error response
      res.status(404).json({
        message: "Folder not found",
        error: true,
      });
    } else {
      // Folder found, proceed with deletion
      const deleteQuery =
        "UPDATE Folder SET is_archieved = true, archieved_at = NOW() WHERE folder_id = $1";
      await pool.query(deleteQuery, [folderId]);
      // const deleteQuery = 'DELETE FROM Folder WHERE folder_id = $1';
      // await pool.query(deleteQuery, [folderId]);

      res.json({
        message: "Folder Archieved successfully",
        error: false,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error occurred",
      error: true,
      // error: err.message
    });
  } finally {
    client.release();
  }
};
// Archieve folder
exports.UnArchieveFolders = async (req, res) => {
  const folderId = req.body.folder_id; // Assuming the folder ID is passed as a URL parameter

  const client = await pool.connect();
  try {
    // Check if the folder exists before attempting to delete
    const checkQuery = "SELECT * FROM Folder WHERE folder_id = $1";
    const checkResult = await pool.query(checkQuery, [folderId]);
  let user_idLog=checkResult.rows[0].user_id
    if (checkResult.rows.length === 0) {
      // Folder not found, return an error response
      res.status(404).json({
        message: "Folder not found",
        error: true,
      });
    } else {
      // Folder found, proceed with deletion
      const deleteQuery =
        "UPDATE Folder SET is_archieved = false WHERE folder_id = $1";
      await pool.query(deleteQuery, [folderId]);

      res.json({
        message: "Folder UnArchieved successfully",
        error: false,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error occurred",
      error: true,
      // error: err.message
    });
  } finally {
    client.release();
  }
};
// restore
exports.restoreFolders = async (req, res) => {
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
        error: true,
      });
    } else {
      // Folder found, proceed with deletion
      const deleteQuery =
        "UPDATE Folder SET is_deleted = false WHERE folder_id = $1";
      await pool.query(deleteQuery, [folderId]);
      // const deleteQuery = 'DELETE FROM Folder WHERE folder_id = $1';
      // await pool.query(deleteQuery, [folderId]);

      res.json({
        message: "Folder restored successfully",
        error: false,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error occurred",
      error: true,
      // error: err.message
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
// update is_deleted to false in folder table
exports.deletePermanent = async (req, res) => {
  const client = await pool.connect();
  try {
    const folder_id = req.body.folder_id;
    let query = "UPDATE Folder SET ";
    let index = 2;
    let values = [folder_id];
    let is_trash_deleted = true;

    if (is_trash_deleted) {
      query += `is_trash_deleted = $${index} , `;
      values.push(is_trash_deleted);
      index++;
    }

    query += "WHERE folder_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);
    if (result.rows[0]) {
      res.json({
        message: "Folder deleted permanently",
        error: false,
      });
    } else {
      res.json({
        message: "Error Occurred",
        error: true,
      });
    }
    // const result = await pool.query('DELETE FROM Folder WHERE folder_id = $1', [folder_id]);
    // res.json({
    //     message: "Folder deleted permanently",
    //     error: false
    // });
  } catch (err) {
    console.log(err);
    res.json({
      message: "Error Occurred",
      error_message: err,
      error: true,
    });
  } finally {
    client.release();
  }
};
