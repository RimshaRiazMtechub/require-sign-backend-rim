const { pool } = require("../../config/db.config");

exports.createPage = async (req, res, next) => {
    const client = await pool.connect();
    try {
        const {
            email

        } = req.body;

        const userData = await pool.query("INSERT INTO verification(email) VALUES($1) returning *",
            [email
            ])
        const data = userData.rows[0]
        res.json({ error: false, data, message: "Verification Created Successfully" });


    }
    catch (err) {
        res.json({ error: true, data: [], message: "Can't Create Page" });

    } finally {
        client.release();
    }

}

exports.updatePages = async (req, res) => {
    const client = await pool.connect();
    try {
        const page_id = req.body.page_id;
        const {page_name,
            language,
            page_title,
            keyword,
            meta_description,
            content
        } = req.body;
        let query = 'UPDATE static_pages SET ';
        let index = 2;
        let values = [page_id];

        if (page_name) {
            query += `page_name = $${index} , `;
            values.push(page_name)
            index++
        }
        if (language) {
            query += `language = $${index} , `;
            values.push(language)
            index++
        }
        if (page_title) {
            query += `page_title = $${index} , `;
            values.push(page_title)
            index++
        }
        if (keyword) {
            query += `keyword = $${index} , `;
            values.push(keyword)
            index++
        }
        if (meta_description) {
            query += `meta_description = $${index} , `;
            values.push(meta_description)
            index++
        }
        if (content) {
            query += `content = $${index} , `;
            values.push(content)
            index++
        }

        query += 'WHERE page_id = $1 RETURNING*'
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
exports.getSinglePage = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            token,
        } = req.body;
        const result = await pool.query('SELECT * FROM verification WHERE verify_id=$1',[
            token
        ]);

        if (result.rows[0]) {
            res.json({
                message: "Data Found ",
                error: false,
                result: result.rows
            })
        }
        else {
            res.json({
                message: "No Data Found",
                error: true,
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
exports.getAllPages = async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await pool.query('SELECT * FROM static_pages');

        if (result.rows[0]) {
            res.json({
                message: "Pages Found ",
                status: true,
                result: result.rows
            })
        }
        else {
            res.json({
                message: "No Pages Found",
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


