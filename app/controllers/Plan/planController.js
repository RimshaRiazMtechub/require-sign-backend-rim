const { pool } = require("../../config/db.config");
const crypto = require("crypto");
var nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
var Secret_Key = process.env.Secret_Key;
const stripe = require("stripe")(Secret_Key);
exports.createPlan = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      user_id,
      user_email,
      plan_name,
      subscription_start_date,
      subscription_end_date,
      amount,
      type,
      transaction_id,
      comment,
    } = req.body;
    if (
      plan_name === null ||
      plan_name === undefined ||
      plan_name === "" ||
      user_id === "" ||
      user_id === null ||
      user_id === undefined
    ) {
      res.json({
        error: false,
        data,
        message: "Missing Plan Name or User Id ",
      });
    } else {
      const userDataCheck = await pool.query(
        "SELECT * FROM users WHERE user_id=$1",
        [user_id]
      );
      if (userDataCheck.rows.length === 0) {
        res.json({ error: true, data: [], message: "User Doesnot Exist" });
      } else {
        const userData = await pool.query(
          "INSERT INTO user_plan(user_id,plan_name,user_email,subscription_start_date,subscription_end_date,amount,type,transaction_id,comment) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *",
          [
            user_id,
            plan_name,
            user_email,
            subscription_start_date,
            subscription_end_date,
            amount,
            type,
            transaction_id,
            comment,
          ]
        );
        const data = userData.rows[0];
        res.json({ error: false, data, message: "Plan Added Successfully" });
      }
    }
  } catch (err) {
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
    const { user_id } = req.body;
    let baseQuery = "SELECT * FROM user_plan WHERE user_id = $1";
    let params = [user_id];
    const result = await pool.query(baseQuery, params);

    if (result.rows[0]) {
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
exports.getUserPlan = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.user_id;

    if (!user_id) {
      return res.json({
        message: "Please provide user_id",
        status: false,
      });
    }
    const query =
      "SELECT * FROM user_plan WHERE user_id = $1 ORDER BY subscription_end_date DESC";
    const result = await pool.query(query, [user_id]);
    const plan_id = result.rows[0].plan_id;
    // Days rewmaining
    // const subscriptionStartDate = new Date(
    //   result.rows[0].subscription_start_date
    // );
    const subscriptionStartDate = new Date(
      result.rows[0].subscription_start_date
    );
    subscriptionStartDate.setHours(0, 0, 0, 0);

    const subscriptionEndDate = new Date(result.rows[0].subscription_end_date);
    subscriptionEndDate.setHours(0, 0, 0, 0);

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Calculate the difference in milliseconds
    const differenceInMilliseconds =
      subscriptionEndDate.getTime() - currentDate.getTime();
    // total days
    const differenceInMillisecondsDays =
      subscriptionEndDate.getTime() - subscriptionStartDate.getTime();

    // Convert the difference from milliseconds to days
    const totalDays = Math.ceil(
      differenceInMillisecondsDays / (1000 * 60 * 60 * 24)
    );

    // Convert the difference from milliseconds to days
    let differenceInDays = Math.ceil(
      differenceInMilliseconds / (1000 * 60 * 60 * 24)
    );
    let percentageRemaining = (differenceInDays / totalDays) * 100;

    // console.log(differenceInDays);
    // console.log(percentageRemaining);
    // console.log(totalDays);

    // Days rewmaining
    const customer_id_stripe = result.rows[0].stripe_customer_id;
    let cards = [];
    let billingDetails = [];

    if (customer_id_stripe) {
      const paymentMetjos = await stripe.paymentMethods.list({
        customer: customer_id_stripe,
        type: "card",
      });
      cards = paymentMetjos.data;
      const customer = await stripe.customers.retrieve(customer_id_stripe);

      billingDetails = {
        name: customer.name,
        email: customer.email,
        address: customer.address,
        phone: customer.phone,
      };
    }

    const planDetailsResult = await client.query(
      "SELECT * FROM pricing WHERE pricing_id = $1",
      [plan_id]
    );

    const TransactionHistory = await client.query(
      "SELECT * FROM transaction_history WHERE user_id = $1",
      [user_id]
    );
    // / Get plan names
    const planNamesResult = await client.query(
      "SELECT pricing_id, name FROM pricing"
    );

    // Create a map of plan ids to names
    const planNamesMap = {};
    for (let row of planNamesResult.rows) {
      planNamesMap[row.pricing_id] = row.name;
    }

    // Replace plan ids with names in transaction history
    const transactionHistory = TransactionHistory.rows.map((transaction) => ({
      ...transaction,
      plan_id: planNamesMap[transaction.plan_id],
    }));
    // console.log(transactionHistory);

    if (result.rows[0]) {
      res.json({
        message: "Plan fetched",
        error: false,
        result: result.rows,
        planDetails: planDetailsResult.rows[0],
        differenceInDays,
        totalDays,
        cards,
        billingDetails,
        percentageRemaining,
        TransactionHistory: transactionHistory,
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
exports.getUserPlanData = async (req, res) => {
  const client = await pool.connect();
  try {
    const user_id = req.body.user_id;

    if (!user_id) {
      return res.json({
        message: "Please provide user_id",
        status: false,
      });
    }
    const query =
      "SELECT * FROM user_plan WHERE user_id = $1 ORDER BY subscription_end_date DESC";
    const result = await pool.query(query, [user_id]);
    const userPlan = result.rows[0];
    const planDetailsResult = await client.query(
      "SELECT * FROM pricing WHERE pricing_id = $1",
      [userPlan.plan_id]
    );
    const userPlanDetails = planDetailsResult.rows[0];

    // Fetch the user's documents
    const userDocumentsResult = await client.query(
      "SELECT * FROM Files WHERE user_id = $1 AND is_trash_deleted=$2",
      [user_id, false || "false"]
    );
    const currentMonth = new Date().getMonth() + 1; // getMonth() returns month index starting from 0
    const currentYear = new Date().getFullYear();
    // Fetch the user's documents created in the current month
    const userDocumentsResult1 = await client.query(
      "SELECT * FROM Files WHERE user_id = $1 AND is_trash_deleted=$2 AND EXTRACT(MONTH FROM created_at) = $3 AND EXTRACT(YEAR FROM created_at) = $4",
      [user_id, false || "false", currentMonth, currentYear]
    );
    const userDocumentsCurrentMonth = userDocumentsResult1.rows.length;
    const userDocuments = userDocumentsResult.rows.length;
    //   userDocuments on current month

    if (result.rows[0]) {
      res.json({
        message: "User Plan fetched",
        error: false,
        userPlan,
        userPlanDetails,
        userDocuments,
        userDocumentsCurrentMonth,
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
