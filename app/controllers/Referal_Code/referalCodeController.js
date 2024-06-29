const { pool } = require("../../config/db.config");
const crypto = require("crypto");
var nodemailer = require("nodemailer");

// const upload = multer({ dest: "uploads/" });

exports.registerReferal_code = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      company_name,
      referal_code,
      company_email,
      organization_contact_no,
      expiry,
      expiry_date,
    } = req.body;

    const userDataCheck = await pool.query(
      "SELECT * FROM referal_code WHERE referal_code=$1",
      [referal_code]
    );
    if (userDataCheck.rows.length === 0) {
      const status = true;
      const userData = await pool.query(
        `INSERT INTO referal_code(company_name,
            referal_code,
            company_email,
            status,
            organization_contact_no,
            expiry,
            expiry_date
        ) VALUES($1,$2,$3,$4,$5,$6,$7) returning *`,
        [
          company_name,
          referal_code,
          company_email,
          status,
          organization_contact_no,
          expiry,
          expiry_date,
        ]
      );
      const data = userData.rows[0];
      res.json({
        error: false,
        data,
        message: "Referal Code Added Successfully",
      });
    } else {
      const data = userDataCheck.rows[0];
      res.json({ error: true, data, message: "Referal Code Already Exist" });
    }
  } catch (err) {
    console.log(err);
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};
exports.deleteReferalCode = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { referal_id } = req.body;

    // Perform the deletion query
    const deleteUserQuery = await pool.query(
      "DELETE FROM referal_code WHERE referal_id = $1",
      [referal_id]
    );

    // Check if any rows were deleted
    if (deleteUserQuery.rowCount === 1) {
      res.json({ error: false, message: "Referal Code Deleted Successfully" });
    } else {
      res.json({ error: true, message: "Cannot Delete Referal Code" });
    }
  } catch (err) {
    res.json({ error: true, data: [], message: err });
  } finally {
    client.release();
  }
};

exports.updateReferal = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      referal_id,
      company_name,
      referal_code,
      company_email,
      expiry_date,
      status,
      organization_contact_no,
    } = req.body;
    let query = "UPDATE referal_code SET ";
    let index = 2;
    let values = [referal_id];

    if (company_name) {
      query += `company_name = $${index} , `;
      values.push(company_name);
      index++;
    }
    if (referal_code) {
      query += `referal_code = $${index} , `;
      values.push(referal_code);
      index++;
    }
    if (company_email) {
      query += `company_email = $${index} , `;
      values.push(company_email);
      index++;
    }
    if (expiry_date) {
      query += `expiry_date = $${index} , `;
      values.push(expiry_date);
      index++;
    }
    if (status) {
      query += `status = $${index} , `;
      values.push(status);
      index++;
    }
    if (expiry) {
      query += `expiry = $${index} , `;
      values.push(expiry);
      index++;
    }
    if (organization_contact_no) {
      query += `organization_contact_no = $${index} , `;
      values.push(organization_contact_no);
      index++;
    }
    // query = query.slice(0, -2); // Remove the trailing comma and space after the last updated field.
    query = query.trim().endsWith(",") ? query.trim().slice(0, -1) : query;
    query += "WHERE referal_id = $1 RETURNING*";
    query = query.replace(/,\s+WHERE/g, " WHERE");
    // console.log(query);

    const result = await pool.query(query, values);
    console.log(result);

    if (result.rows[0]) {
      res.json({
        message: "Referal Code Updated Successfully",
        error: false,
        result: result.rows[0],
      });
    } else {
      res.json({
        message: "Code could not be Updated",
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
    const { referal_id, status } = req.body;

    if (!referal_id || !status) {
      res.status(400).json({
        message: "Referal ID and status are required",
        error: true,
      });
      return;
    }

    let query =
      "UPDATE referal_code SET status = $1 WHERE referal_id = $2 RETURNING *";
    let values = [status, referal_id];

    const result = await client.query(query, values);

    if (result.rows[0]) {
      res.json({
        message: "Referal Code status updated successfully",
        error: false,
        result: result.rows[0],
      });
    } else {
      res.json({
        message: "Referal Code could not be updated",
        error: true,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "An error occurred",
      error: true,
      error_message: err.message,
    });
  } finally {
    client.release();
  }
};
exports.changeStatus = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const company_ids = req.body.Referal_code_ids; // Array of company_ids
    const status = req.body.status;

    if (!Array.isArray(company_ids) || company_ids.length === 0) {
      return res.json({
        message: "Invalid Referal_code_ids provided.",
        status: false,
      });
    }

    let query = "UPDATE referal_code SET ";
    let index = 1;
    let values = [];

    if (status) {
      query += `status = $${index}, `;
      values.push(status);
      index++;
    }

    query = query.slice(0, -2); // Remove the trailing comma and space after the last updated field.

    query += " WHERE referal_id IN (";

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
        message: "Referal Status has been Updated Successfully",
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

exports.getAllReferal_codes = async (req, res) => {
  const client = await pool.connect();
  try {
    const query = "SELECT * FROM referal_code";
    const result = await pool.query(query);

    if (result.rows) {
      res.json({
        message: "All Referal Code Fetched",
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

exports.getReferal_codeById = async (req, res) => {
  const client = await pool.connect();
  try {
    const Referal_code_id = req.body.referal_id;

    if (!Referal_code_id) {
      return res.json({
        message: "Please provide Referal_code_id",
        status: false,
      });
    }
    const query = "SELECT * FROM referal_code WHERE referal_id = $1";
    const result = await pool.query(query, [Referal_code_id]);

    if (result.rows[0]) {
      res.json({
        message: "Referal Code fetched",
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
exports.deleteReferal_codes = async (req, res) => {
  const client = await pool.connect();
  try {
    const referal_ids = req.body.referal_ids;
    let deletedBulkLinks = [];
    for (let i = 0; i < referal_ids.length; i++) {
      const query = "DELETE FROM bulk_links WHERE bulk_link_id= $1 RETURNING*";
      const result = await pool.query(query, [referal_ids[i].item]);
      if (result.rows[0]) {
        deletedBulkLinks.push(result.rows[0]);
      }
    }
    if (deletedBulkLinks.length > 0) {
      res.json({
        message: "Referal Code Deleted",
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
