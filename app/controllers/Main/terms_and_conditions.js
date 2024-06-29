

const {pool} = require('../../config/db.config');


exports.addTermsAndConditions = async(req,res)=>{
    const client = await pool.connect();
    try{
        const text = req.body.text ;
        const query= 'INSERT INTO terms_and_condtions (text) Values ($1) RETURNING *'
        const result = await pool.query(query , [text]);

        if(result.rows[0]){
            res.json({
                message: "Created terms",
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


exports.getAllTermsAndConditions = async(req,res)=>{
    const client = await pool.connect();
    try{
        const query = 'SELECT * FROM terms_and_condtions';

        const result = await pool.query(query);

        if(result.rows){
            res.json({
                message: "All Fetched terms_and_condtions",
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

exports.viewTermsAndCondition = async(req,res)=>{
    const client = await pool.connect();

    try{
        const term_condition_id = req.body.terms_and_condition_id;
        const query = 'SELECT * FROM terms_and_condtions WHERE terms_and_condition_id= $1';

        const result = await pool.query(query , [term_condition_id]);

        if(result.rows[0]){
            res.json({
                message: "term_condition_id fetched",
                status : true,
                result : result.rows[0]
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

exports.viewActiveTermsAndCondition = async(req,res)=>{
    const client = await pool.connect();

    try{
        const query = 'SELECT * FROM terms_and_condtions WHERE status = $1';
        const result = await pool.query(query , ['active']);

        if(result.rows[0]){
            res.json({
                message: "Active term_condition fetched",
                status : true,
                result : result.rows[0]
            })
         }
         else{
            res.json({
                message: "No terms and condtions found",
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

exports.updateTermsAndCondition= async(req,res)=>{
    const client = await pool.connect();
    try{
        const terms_and_condition_id = req.body.terms_and_condition_id;
        const text = req.body.text;

        const query = 'UPDATE terms_and_condtions SET text = $2 WHERE terms_and_condition_id= $1 RETURNING*';

        const result = await pool.query(query , [terms_and_condition_id , text]);

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
        const terms_and_condition_id = req.body.terms_and_condition_id;
        const status = req.body.status ;
        let message2 =null;
        if(status == 'active'){
            let inactiveQuery = 'UPDATE terms_and_condtions SET status = $1 RETURNING*';
            const inactivated = await pool.query(inactiveQuery , ['inactive']);
            if(inactivated.rows){   
                message2 = 'As you want to change this status active , all others will are in activated'
            }   
        }
        
        const query = 'UPDATE terms_and_condtions SET status = $2 WHERE terms_and_condition_id= $1 RETURNING*';

        const result = await pool.query(query , [terms_and_condition_id , status]);

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