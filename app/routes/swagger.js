* @swagger
* /getAllUsers:
*   get:
*     summary: Returns a list of users
*     description: Retrieve a list of users from the database
*     responses:
*       200:
*         description: A list of users
*         content:
*           application/json:
*             schema:
*               type: array
*               items:
*                 type: object
*                 properties:
*                   id:
*                     type: integer
*                     description: The user ID
*                   name:
*                     type: string
*                     description: The name of the user
*                   email:
*                     type: string
*                     description: The email of the user
*               example:
*                 - id: 1
*                   name: John Doe
*                   email: johndoe@example.com
*                 - id: 2
*                   name: Jane Smith
*                   email: janesmith@example.com
*       400:
*         description: Bad request
*       500:
*         description: Internal server error
*/
// const express = require('express');
// const router = express.Router();
// const controller = require("../controllers/USERS/customerController")

// router.get("/getAllUsers", controller.getAllCustomers);

