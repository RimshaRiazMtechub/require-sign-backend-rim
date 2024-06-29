const { pool } = require("../../config/db.config");
const crypto = require('crypto');

exports.createreq = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const {
            name,
            email,
            phone_no,
            type,
            received_on,
            message,

        } = req.body;

        const userData = await pool.query("INSERT INTO contact_us(name,email,phone_no,type,received_on,message) VALUES($1,$2,$3,$4,$5,$6) returning *",
            [name,
                email,
                phone_no,
                type,
                received_on,
                message,
            ])
        const data = userData.rows[0]
        res.json({ error: false, data, message: "Request Submitted Successfully" });


    }
    catch (err) {
        res.json({ error: true, data: [], message: "Can't Submit Request Right Now" });

    } finally {
        client.release();
    }

}




exports.updateProfile = async (req, res) => {
    const client = await pool.connect();
    try {
        const req_id = req.body.req_id;
        const req_name = req.body.req_name;
        let query = 'UPDATE req SET ';
        let index = 2;
        let values = [req_id];

        if (req_name) {
            query += `req_name = $${index} , `;
            values.push(req_name)
            index++
        }

        query += 'WHERE req_id = $1 RETURNING*'
        query = query.replace(/,\s+WHERE/g, " WHERE");
        // console.log(query);


        const result = await pool.query(query, values)

        // console.log(result)

        if (result.rows[0]) {
            res.json({
                message: "Record Updated",
                status: true,
                result: result.rows[0]
            })
        }
        else {
            res.json({
                message: "Record could not be updated",
                status: false,
            })
        }

    }
    catch (err) {
        console.log(err)
        res.json({
            message: "Error Occurred",
            status: false,
            error: err.message
        })
    }
    finally {
        client.release();
    }
}

exports.passwordUpdate = async (req, res) => {
    const client = await pool.connect();
    try {
        const { email, password } = req.body;
        const salt = 'mySalt';
        const hashedPassword = crypto.createHash('sha256').update(password + salt).digest('hex');
        // console.log(hashedPassword);
        const userDataCheck = await pool.query("SELECT * FROM users WHERE email=$1",
            [email]);
        // res.json(userDataCheck.rows)
        if (userDataCheck.rows.length === 0) {
            // const data=userDataCheck.rows[0]
            res.json({ error: true, data: [], message: "Email Doesnot Exist" });
        } else {
            const userData = await pool.query(`UPDATE users SET password=$1 WHERE email=$2 returning *`,
                [hashedPassword, email]);
            const data = userData.rows[0]
            res.json({ error: true, data, message: "Updated Successfully" });
        }
    }
    catch (err) {
        console.log(err)
        res.json({
            message: "Error Occurred",
            status: false,
            error: err.message
        })
    }
    finally {
        client.release();
    }
}

exports.getAllreqs = async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await pool.query('SELECT * FROM contact_us');

        if (result.rows[0]) {
            res.json({
                message: " Requests Found ",
                status: true,
                result: result.rows
            })
        }
        else {
            res.json({
                message: "No Request Found",
                status: false,
            })
        }
    }
    catch (err) {
        console.log(err)
        res.json({
            message: "Error Occurred",
            status: false,
            error: err.message
        })
    }
    finally {
        client.release();
    }
}
exports.deletereqs = async (req, res) => {
    const reqId = req.body.req_id; // Assuming the req ID is passed as a URL parameter

    const client = await pool.connect();
    try {
        // Check if the req exists before attempting to delete
        const checkQuery = 'SELECT * FROM req WHERE req_id = $1';
        const checkResult = await pool.query(checkQuery, [reqId]);

        if (checkResult.rows.length === 0) {
            // req not found, return an error response
            res.status(404).json({
                message: "req not found",
                status: false
            });
        } else {
            // req found, proceed with deletion
            const deleteQuery = 'DELETE FROM req WHERE req_id = $1';
            await pool.query(deleteQuery, [reqId]);

            res.json({
                message: "req deleted successfully",
                status: true
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Error occurred",
            status: false,
            error: err.message
        });
    } finally {
        client.release();
    }
}
exports.updateStatus = async (req, res) => {
    const client = await pool.connect();
    try {
        const req_id = req.body.req_id;
        const status = req.body.status;
        let query = 'UPDATE req SET ';
        let index = 2;
        let values = [req_id];

        if (status) {
            query += `status = $${index} , `;
            values.push(status)
            index++
        }

        query += 'WHERE req_id = $1 RETURNING*'
        query = query.replace(/,\s+WHERE/g, " WHERE");
        // console.log(query);


        const result = await pool.query(query, values)

        // console.log(result)

        if (result.rows[0]) {
            res.json({
                message: "Record Updated",
                status: true,
                result: result.rows[0]
            })
        }
        else {
            res.json({
                message: "Record could not be updated",
                status: false,
            })
        }

    }
    catch (err) {
        console.log(err)
        res.json({
            message: "Error Occurred",
            status: false,
            error: err.message
        })
    }
    finally {
        client.release();
    }
}


