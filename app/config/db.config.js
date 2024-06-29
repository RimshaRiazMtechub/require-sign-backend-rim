const { Pool } = require("pg");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");

console.log(process.env.USER);
const pool = new Pool({
  host: process.env.HOST,
  port: process.env.DB_PORT,
  user: process.env.USER_NAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  max: process.env.MAX,
  // host: "localhost",
  // port: 5432,
  // user: "postgres",
  // password: "mtechub123",
  // database: "require-sign",
  // max: 10,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Error connecting to database:", err);
  } else {
    console.log("Connected to database successfully");

    release();
  }
});

const initSql = fs.readFileSync("app/models/init.sql").toString();

pool.query(initSql, (err, result) => {
  if (!err) {
    console.log("All Database tables Initialilzed successfully : ");
    // console.log(result)
  } else {
    console.log("Error Occurred While Initializing Database tables");
    console.log(err);
  }
});
// Function to update records where deleted_at date is past 14 days
async function update_deleted_records() {
  try {
    const updateQuery = `
          UPDATE Folder
          SET is_trash_deleted = true
          WHERE is_deleted = true AND deleted_at < NOW() - INTERVAL '14 days';
      `;
    const res = await pool.query(updateQuery);
    console.log("Records updated successfully:", res.rowCount);
  } catch (error) {
    console.error("Error updating records:", error);
  }
}
// Function to update records where deleted_at date is past 14 days
async function update_deleted_records_file() {
  try {
    const updateQuery = `
            UPDATE Files
            SET is_trash_deleted = true
            WHERE is_deleted = true AND deleted_at < NOW() - INTERVAL '14 days';
        `;
    const res = await pool.query(updateQuery);
    console.log("Records updated successfully:", res.rowCount);
  } catch (error) {
    console.error("Error updating records:", error);
  }
}
// Function to delete records where deleted_at date is past 74 days and is_trash_deleted is true
async function delete_trashed_records() {
  try {
    const deleteQuery = `
          DELETE FROM Folder
          WHERE is_trash_deleted = true AND deleted_at < NOW() - INTERVAL '74 days';
      `;
    const res = await pool.query(deleteQuery);
    console.log("Records deleted successfully:", res.rowCount);
  } catch (error) {
    console.error("Error deleting records:", error);
  }
}
// Function to delete records where deleted_at date is past 74 days and is_trash_deleted is true
async function delete_trashed_records_file() {
  try {
    const deleteQuery = `
          DELETE FROM Files
          WHERE is_trash_deleted = true AND deleted_at < NOW() - INTERVAL '74 days';
      `;
    const res = await pool.query(deleteQuery);
    console.log("Records deleted successfully:", res.rowCount);
  } catch (error) {
    console.error("Error deleting records:", error);
  }
}
// Schedule cron job to run update_deleted_records function daily at 12 PM 30 12 * * *
cron.schedule("29 1 * * *", async () => {
  console.log("Running update_deleted_records cron job");
  await update_deleted_records();
  await update_deleted_records_file();
  await delete_trashed_records();
  await delete_trashed_records_file();
});

module.exports = { pool };
