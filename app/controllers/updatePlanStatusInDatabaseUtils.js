const nodemailer = require('nodemailer');
const Emailtemplate = require('./emailUtils');
const { pool } = require("../config/db.config");
const urls = require('../urls');
const SubscriptionExpired = require('../EmailUtils/subscription_expired_email');

async function updatePlanStatusInDatabase(user_type,email, newStatus, plan_id, first_name, last_name,res) {
    // Your database update logic here
    if(user_type==="company"){
        console.log(`Updating user ${email}'s plan status to ${newStatus}`);
        // update plan and email that account is inactive 
        // const activatedPlan = planData.rows[0].plan_id
        const status = "InActive"
        let query = 'UPDATE user_plan SET ';
        let index = 2;
        let values = [plan_id];
    
        if (status) {
            query += `status = $${index} , `;
            values.push(status)
            index++
        }
        query += 'WHERE plan_id = $1 RETURNING*'
        query = query.replace(/,\s+WHERE/g, " WHERE");
        // console.log(query);
        const result = await pool.query(query, values)
        // console.log(result)
        if (result.rows.length === 0) {
            // callbackRes({ error: true, message: "Some Issue Occur we can't Inactive Subscription " })
            res.json({ error: true, message: "Some Issue Occur we can't Inactive Subscription " });
    
        } else {
            const activatedPlan = "null"
            // const license_key = "null"

            let query1 = 'UPDATE company SET ';
            let index1 = 2;
            let values1 = [email];
    
            if (activatedPlan) {
                query1 += `activatedPlan = $${index1} , `;
                values1.push(activatedPlan)
                index1++
            }
            query1 += 'WHERE company_email = $1 RETURNING*'
            query1 = query1.replace(/,\s+WHERE/g, " WHERE");
            // console.log(query);
            const resultUser = await pool.query(query1, values1)
            // console.log(result)
            if (resultUser.rows.length === 0) {
                res.json({ error: true, message: "Some Issue Occur we can't Inactive Subscription on User" });
    
            } else {
                //  Inactive Subscription ..Send Email 
                const subject = "Your Subscription Has Expired - Renew Now!"
                const message = `We hope you've been enjoying your time with our service.
                 Your free trial has expired, but there's no need to worry. 
                 Renew your subscription to keep the momentum going!`
                const btnText = `Avail Subscription`;
                const resetLink = urls.renew_subscription_url;
                SubscriptionExpired(email, resetLink, first_name, last_name, subject, message, btnText);
    
                // sendEmailscheduleForplan(email, message, subject, first_name, last_name);
            }
        }
    }else{
        console.log(`Updating user ${email}'s plan status to ${newStatus}`);
        // update plan and email that account is inactive 
        // const activatedPlan = planData.rows[0].plan_id
        const status = "InActive"
        let query = 'UPDATE user_plan SET ';
        let index = 2;
        let values = [plan_id];
    
        if (status) {
            query += `status = $${index} , `;
            values.push(status)
            index++
        }
        query += 'WHERE plan_id = $1 RETURNING*'
        query = query.replace(/,\s+WHERE/g, " WHERE");
        // console.log(query);
        const result = await pool.query(query, values)
        // console.log(result)
        if (result.rows.length === 0) {
            res.json({ error: true, message: "Some Issue Occur we can't Inactive Subscription " });
    
        } else {
            const activatedPlan = "null"
            let query1 = 'UPDATE users SET ';
            let index1 = 2;
            let values1 = [email];
    
            if (activatedPlan) {
                query1 += `activatedPlan = $${index1} , `;
                values1.push(activatedPlan)
                index1++
            }
            query1 += 'WHERE email = $1 RETURNING*'
            query1 = query1.replace(/,\s+WHERE/g, " WHERE");
            // console.log(query);
            const resultUser = await pool.query(query1, values1)
            // console.log(result)
            if (resultUser.rows.length === 0) {
                res.json({ error: true, message: "Some Issue Occur we can't Inactive Subscription on User" });
    
            } else {
                //  Inactive Subscription ..Send Email 
                const subject = "Your Subscription Has Expired - Renew Now!"
                const message = `We hope you've been enjoying your time with our service.
                 Your free trial has expired, but there's no need to worry. 
                 Renew your subscription to keep the momentum going!`
                const btnText = `Avail Subscription`;
                const resetLink = urls.renew_subscription_url;
                SubscriptionExpired(email, resetLink, first_name, last_name, subject, message, btnText);
    
                // sendEmailscheduleForplan(email, message, subject, first_name, last_name);
            }
        }
    }
    

}

module.exports = updatePlanStatusInDatabase;