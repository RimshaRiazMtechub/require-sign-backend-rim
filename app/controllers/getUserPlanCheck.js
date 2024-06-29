const { pool } = require("../config/db.config");

 const getUserPlanAndDocuments = async (userId) => {
    const client = await pool.connect();
    try {
      // Fetch the user's plan
      const userPlanResult = await client.query(
        "SELECT * FROM user_plan WHERE user_id = $1",
        [userId]
      );
      const userPlan = userPlanResult.rows[0];
  
      // Fetch the plan details
      const planDetailsResult = await client.query(
        "SELECT * FROM pricing WHERE pricing_id = $1",
        [userPlan.plan_id]
      );
      const planDetails = planDetailsResult.rows[0];
  
      // Fetch the user's documents
      const userDocumentsResult = await client.query(
        "SELECT * FROM Files WHERE user_id = $1",
        [userId]
      );
      const userDocuments = userDocumentsResult.rows;
  
      return {
        userPlan,
        planDetails,
        userDocuments,
      };
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      client.release();
    }
  };
  module.exports = getUserPlanAndDocuments;