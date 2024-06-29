const nodemailer = require('nodemailer');
const Emailtemplate = require('./emailUtils');
const schedule = require('node-schedule');
const urls = require("../urls");
const updatePlanStatusInDatabase = require('./updatePlanStatusInDatabaseUtils');
const { pool } = require('../config/db.config');
const EmailSubscriptionExpiringSoon = require('../EmailUtils/subscription_expiring_soom_email');

const nodeScheduletoSendemailForPlan = async (user_type, expirationDate, email, plan_id, first_name, last_name) => {

    // stop schedule 

    const now = new Date();
    const daysUntilExpiration = Math.floor((expirationDate - now) / (1000 * 60 * 60 * 24));
    console.log(daysUntilExpiration)
    console.log(expirationDate)

    // Schedule email notifications
    const twoDaysBeforeExpiration = new Date(expirationDate);
    //   twoDaysBeforeExpiration.setDate(expirationDate.getDate() - 2);
    twoDaysBeforeExpiration.setMinutes(expirationDate.getMinutes() - 3);

    const fourDaysBeforeExpiration = new Date(expirationDate);
    //   fourDaysBeforeExpiration.setDate(expirationDate.getDate() - 4);
    fourDaysBeforeExpiration.setMinutes(expirationDate.getMinutes() - 1);

    schedule.scheduleJob(twoDaysBeforeExpiration, async function () {
        const PlanCheck = await pool.query("SELECT * FROM user_plan WHERE plan_id=$1",
            [plan_id]);
        console.log(PlanCheck.rows[0].status)
        if (PlanCheck.rows[0].status === "InActive") {
            console.log(PlanCheck.rows[0].status)
            return;
        } else {
            console.log("Not activated")
            const message = `Your free trial is about to end in just 3 minutes. 
        Don't miss out on all the amazing features and benefits! 
        Renew your subscription now to continue enjoying our services.`;
        const subject = `Renew Your Subscription - 3 minutes Left!`;
        const btnText = `Renew Subscription`;
        const resetLink = urls.renew_subscription_url;

        EmailSubscriptionExpiringSoon(email, resetLink, first_name, last_name, subject, message, btnText);
        }
        
    });

    schedule.scheduleJob(fourDaysBeforeExpiration, async function () {
        const PlanCheck = await pool.query("SELECT * FROM user_plan WHERE plan_id=$1",
            [plan_id]);
            if (PlanCheck.rows[0].status === "InActive") {
                console.log(PlanCheck.rows[0].status)
                return;
            } else {
                console.log("Not activated")
                 const message = `Your free trial is about to end in just 1 minutes. 
        Don't miss out on all the amazing features and benefits! 
        Renew your subscription now to continue enjoying our services.`;
        const subject = `Renew Your Subscription - 2 minutes Left!`;
        const btnText = `Renew Subscription`;
        const resetLink = urls.renew_subscription_url;

        EmailSubscriptionExpiringSoon(email, resetLink, first_name, last_name, subject, message, btnText);

            }
       

    });
    // Schedule status update on expiration date
    const expirationJob = schedule.scheduleJob(expirationDate, async function () {
        const PlanCheck = await pool.query("SELECT * FROM user_plan WHERE plan_id=$1",
            [plan_id]);
        if (PlanCheck.rows[0].status === "InActive") {
            console.log(PlanCheck.rows[0].status)
            return;
        } else {
             updatePlanStatusInDatabase(user_type, email, 'expired', plan_id, first_name, last_name);
        }
       
    });

}
module.exports = nodeScheduletoSendemailForPlan;