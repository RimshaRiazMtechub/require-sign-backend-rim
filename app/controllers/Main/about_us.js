const {pool} = require('../../config/db.config');


exports.add_aboutus = async(req,res)=>{
    const client = await pool.connect();
    try{
        const text = req.body.text ;
        const query= 'INSERT INTO about_us (text) Values ($1) RETURNING *'
        const result = await pool.query(query , [text]);

        if(result.rows[0]){
            res.json({
                message: "Created about_us",
                status : true,
                result : result.rows[0]
            })
         }
         else{
            res.json({
                message: "Could not insert record",
                status : false
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


exports.getAlladd_aboutus= async(req,res)=>{
    const client = await pool.connect();

    try{
        const query = 'SELECT * FROM about_us';

        const result = await pool.query(query);

        if(result.rows){
            res.json({
                message: "All Fetched about_us",
                status : true,
                result : result.rows
            })
         }
         else{
            res.json({
                message: "Could not fetch record",
                status : false
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

exports.viewAboutUs = async(req,res)=>{
    const client = await pool.connect();
    try{
        const about_us_id = req.body.about_us_id;
        const query = 'SELECT * FROM about_us WHERE about_us_id= $1';

        const result = await pool.query(query , [about_us_id]);

        if(result.rows[0]){
            res.json({
                message: "about_us fetched",
                status : true,
                result : result.rows[0]
            })
         }
         else{
            res.json({
                message: "Could not fetch record",
                status :false
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

exports.viewActiveAboutUs = async(req,res)=>{
    const client = await pool.connect();

    try{
        const query = 'SELECT * FROM about_us WHERE status = $1';

        const result = await pool.query(query , ['active']);

        if(result.rows[0]){
            res.json({
                message: "Active about_us fetched",
                status : true,
                result : result.rows[0]
            })
         }
         else{
            res.json({
                message: "No  about_us found",
                status : false
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

exports.updateAboutUs= async(req,res)=>{
    const client = await pool.connect();

    try{
        const about_us_id = req.body.about_us_id;
        const text = req.body.text;

        const query = 'UPDATE about_us SET text = $2 WHERE about_us_id= $1 RETURNING*';

        const result = await pool.query(query , [about_us_id , text]);

        if(result.rows[0]){
            res.json({
                message: "Text updated",
                status : true,
                result : result.rows[0]
            })
         }
         else{
            res.json({
                message: "Could not update record",
                status : false
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

exports.updateStatus= async(req,res)=>{
    const client = await pool.connect();
    try{
        const about_us_id = req.body.about_us_id;
        const status = req.body.status ;
        let message2 =null;
        if(status == 'active'){
            let inactiveQuery = 'UPDATE about_us SET status = $1 RETURNING*';
            const inactivated = await pool.query(inactiveQuery , ['inactive']);
            if(inactivated.rows){   
                message2 = 'As you want to change this status active , all others will are in activated'
            }   
        }
        
        const query = 'UPDATE about_us SET status = $2 WHERE about_us_id= $1 RETURNING*';

        const result = await pool.query(query , [about_us_id , status]);

        if(result.rows[0]){
            res.json({
                message: "Status changed to active",
                status : true,
                message2 : message2,
                result : result.rows[0],
            })
         }
         else{
            res.json({
                message: "Could not update record",
                status : false
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