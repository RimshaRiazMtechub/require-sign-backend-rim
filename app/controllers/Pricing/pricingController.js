const { pool } = require("../../config/db.config");
const crypto = require("crypto");
var nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");

exports.createPlan = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      name,
      type,
      monthly_price,
      yearly_price,
    } = req.body;

    if (!name) {
      res.json({ error: true, message: "Missing Pricing Name" });
      return;
    }

    // Check if a plan with the given name and type already exists
    const existingPlanData = await pool.query(
      "SELECT * FROM pricing WHERE type = $1",
      [ type]
    );


    if (existingPlanData.rows.length > 0) {
      // If the plan exists, update it
      let updateQuery;
      let queryParams;
      
      if (monthly_price) {
        updateQuery = "UPDATE pricing SET name=$1, monthly_price=$2 WHERE type = $3 RETURNING *";
        queryParams = [name, monthly_price, type];
      } else if (yearly_price) {
        updateQuery = "UPDATE pricing SET name=$1, yearly_price=$2 WHERE type = $3 RETURNING *";
        queryParams = [name, yearly_price, type];
      } else {
        updateQuery = "UPDATE pricing SET name=$1 WHERE type = $2 RETURNING *";
        queryParams = [name, type];
      }
      const updateData = await pool.query(updateQuery, queryParams);
      res.json({
        error: false,
        data: updateData,
        message: "Pricing Updated Successfully",
      });
    } else {
      // If the plan doesn't exist, error
      res.json({
        error: true,
        data: [],
        message: "Plan Not found",
      });
    }

    // Delete existing features
    // await pool.query("DELETE FROM feature WHERE pricing_id = $1", [
    //   pricingData.pricing_id,
    // ]);

    // // Insert each feature into the feature table
    // for (let feature of features) {
    //   await pool.query(
    //     "INSERT INTO feature(pricing_id, description) VALUES($1, $2)",
    //     [pricingData.pricing_id, feature]
    //   );
    // }

   
  } catch (err) {
    console.log(err);
    res.json({ error: true, data: [], message: "Provide Valid Data" });
  } finally {
    client.release();
  }
};

exports.updateProfile = async (req, res) => {
  const client = await pool.connect();
  try {
    const Plan_id = req.body.Plan_id;
    const Plan_name = req.body.Plan_name;
    let query = "UPDATE Plan SET ";
    let index = 2;
    let values = [Plan_id];

    if (Plan_name) {
      query += `Plan_name = $${index} , `;
      values.push(Plan_name);
      index++;
    }

    query += "WHERE Plan_id = $1 RETURNING*";
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

exports.getAllPlans = async (req, res) => {
  const client = await pool.connect();
  try {
    let baseQuery = "SELECT * FROM pricing ORDER BY pricing_id ASC";
    const result = await client.query(baseQuery);

    if (result.rows[0]) {
      // Fetch features for each pricing plan
      // for (let plan of result.rows) {
      //   const featureQuery = "SELECT * FROM feature WHERE pricing_id = $1";
      //   const featureResult = await client.query(featureQuery, [plan.pricing_id]);
      //   plan.features = featureResult.rows;
      // }

      res.json({
        message: " Data Found ",
        status: true,
        result: result.rows,
      });
    } else {
      res.json({
        message: "No Data Found",
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

exports.getPlanByType = async (req, res) => {
  // get plan by type

  const client = await pool.connect();
  try {
    const type = req.body.type;

    if (!type) {
      return res.json({
        message: "Please provide type",
        status: false,
      });
    }
    const query = "SELECT * FROM pricing WHERE type = $1";
    const result = await client.query(query, [type]);

    if (result.rows[0]) {
      // Fetch features for each pricing plan
      for (let plan of result.rows) {
        const featureQuery = "SELECT * FROM feature WHERE pricing_id = $1";
        const featureResult = await client.query(featureQuery, [
          plan.pricing_id,
        ]);
        plan.features = featureResult.rows;
      }

      res.json({
        message: "Plan fetched",
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

exports.getUserPlan = async (req, res) => {
  const client = await pool.connect();
  try {
    const plan_id = req.body.pricing_id;

    if (!plan_id) {
      return res.json({
        message: "Please provide pricing_id",
        status: false,
      });
    }
    const query = "SELECT * FROM pricing WHERE pricing_id = $1";
    const result = await client.query(query, [plan_id]);

    if (result.rows[0]) {
      // Fetch features for the pricing plan
      const featureQuery = "SELECT * FROM feature WHERE pricing_id = $1";
      const featureResult = await client.query(featureQuery, [plan_id]);
      result.rows[0].features = featureResult.rows;

      res.json({
        message: "Plan fetched",
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

exports.deletePlans = async (req, res) => {
  const PlanId = req.body.Plan_id; // Assuming the Plan ID is passed as a URL parameter

  const client = await pool.connect();
  try {
    // Check if the Plan exists before attempting to delete
    const checkQuery = "SELECT * FROM Plan WHERE Plan_id = $1";
    const checkResult = await pool.query(checkQuery, [PlanId]);

    if (checkResult.rows.length === 0) {
      // Plan not found, return an error response
      res.status(404).json({
        message: "Plan not found",
        status: false,
      });
    } else {
      // Plan found, proceed with deletion
      const deleteQuery = "DELETE FROM Plan WHERE Plan_id = $1";
      await pool.query(deleteQuery, [PlanId]);

      res.json({
        message: "Plan deleted successfully",
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
    const Plan_id = req.body.Plan_id;
    const status = req.body.status;
    let query = "UPDATE Plan SET ";
    let index = 2;
    let values = [Plan_id];

    if (status) {
      query += `status = $${index} , `;
      values.push(status);
      index++;
    }

    query += "WHERE Plan_id = $1 RETURNING*";
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
