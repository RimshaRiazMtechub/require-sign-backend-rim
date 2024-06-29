const express = require("express");
const app = express();
const dbConfig = require("./app/config/db.config");
const http = require("http");
const socket = require("socket.io");
const { pool } = require("./app/config/db.config");
const PDFDocument = require("pdfkit");
const https = require("https");
const fs = require("fs");
const path = require("path");

var Publishable_Key = process.env.Publishable_Key;
var Secret_Key = process.env.Secret_Key;
const stripe = require("stripe")(Secret_Key);
const multer = require("multer");
// const fetch = require('node-fetch');

// const socketio = require('socket.io');
const PORT = process.env.PORT || 3004;
const bodyParser = require("body-parser");
// const server = http.createServer(app);

// const io = require('socket.io')(server);
require("dotenv").config();
// const auth = require('./app/middlewares/auth')
const cors = require("cors");
const imageURL = require("./app/EmailImage");
const EmailReceipt = require("./app/EmailUtils/receipt_plan");
const { backendUrl } = require("./app/urls");

app.use(
  cors({
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);

let endpointSecret;
endpointSecret =
  "whsec_78477c4b99a5a41c9ebf9a97d7a570bb12a519d4afea722c79ada23b72ba5eaa";
// webhook
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (request, response) => {
    // const sig = request.headers['stripe-signature'];
    if (endpointSecret) {
      const signature = request.headers["stripe-signature"];
      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          signature,
          endpointSecret
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return response.sendStatus(400);
      }
    }
    let subscription;
    let status;

    switch (event.type) {
      case "customer.subscription.created": {
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        break;
      }
      case "payment_intent.succeeded": {
        subscription = event.data.object;
        status = subscription.status;
        console.log(`paymnt succeeded is ${status}.`);
        break;
      }
      case "invoice.payment_succeeded": {
        subscription = event.data.object;
        status = subscription.status;
        console.log(` invoice paymnt succeeded is ${status}.`);
        break;
      }

      // Here called Node mailer

      default:
        console.log(`Unhandled event type ${event.type}.`);
    }
    response.send();

    // Return a 200 response to acknowledge receipt of the event
  }
);
// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.use(
  cors({
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  })
);
// parse application/json
app.use(
  "/emailVerification",
  require("./app/routes/EmailVerification/emailVerificationRoute")
);

app.use("/uploads", express.static("uploads"));
const upload = multer({ dest: "uploads/" });

app.use("/upload-image", require("./app/utils/upload-image"));
app.use("/upload-pdf", require("./app/utils/upload-pdf"));

// Company
app.use("/company", require("./app/routes/Company/companyRoute"));
// Referal code
app.use(
  "/referal_code",
  require("./app/routes/Referal_CodeRoute/referalCodeRoute")
);
// contact us
app.use("/contact_us", require("./app/routes/Contact_Us/contactUsRoute"));
app.use("/static_pages", require("./app/routes/Static_Pages/staticPagesRoute"));

// User Apis
app.use("/plan", require("./app/routes/Plan/planRoute"));
app.use("/pricing", require("./app/routes/Pricing/pricingRoute"));

app.use("/user", require("./app/routes/Users/customerRoute"));
app.use(
  "/dedicated_server",
  require("./app/routes/Dedicated_Server/DedicatedServerRoute")
);

app.use("/documents", require("./app/routes/Documents/documentsRoute"));
app.use("/folder", require("./app/routes/Folder/folderRoute"));
app.use("/file", require("./app/routes/Files/filesRoute"));

app.use(
  "/transaction_history",
  require("./app/routes/TransactionHistory/TransactionHistoryRoute")
);

// Admin apis
app.use("/admin", require("./app/routes/Admin/adminRoute"));
app.use("/aboutus", require("./app/routes/Main/about_usRoute"));
app.use("/privacy_policy", require("./app/routes/Main/privacy_policyRoute"));
app.use(
  "/terms_and_conditions",
  require("./app/routes/Main/terms_and_conditionsRoute")
);
app.use("/bulk_links", require("./app/routes/BulkLinks/bulkLinkRoute"));
app.use("/template", require("./app/routes/Template/templateRoute"));
// ACTIVITY LOG USER
app.post("/activity_log_maintain", async (req, res) => {
  const {
    user_id,
    event,
    description,
    location_country,
    ip_address,
    location_date,
    timezone,
  } = req.body;

  try {
    // const event_type="FOLDER-UNARCHIVED";

    const audit_result = await pool.query(
      "INSERT INTO audit_log(user_id,event,description,location_country,ip_address,location_date,timezone) VALUES($1,$2,$3,$4,$5,$6,$7) returning *",
      [
        user_id,
        event,
        description,
        location_country,
        ip_address,
        location_date,
        timezone,
      ]
    );
    if (audit_result.rows.length === 0) {
      console.log(`LOG MAINTAIN ERROR ${event} ${user_id}`);
      res.json({
        message: `LOG MAINTAIN ERROR ${event} ${user_id}`,
        error: true,
      });
    } else {
      console.log("SUCCESS LOG SIGN IN ");
      res.json({
        message: `LOG MAINTAIN SUCCESS ${event} ${user_id}`,
        error: false,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// STRIPE

const createCustomer = async (
  customeremail,
  paymentMethodId,
  address,
  city,
  country,
  zip_code,
  province,
  phone_number,
  name,
  user_id_req,
  prevCard
) => {
  // Search for an existing customer by email
  const existingCustomers = await stripe.customers.list({
    email: customeremail,
    limit: 1,
  });

  let customer;

  if (existingCustomers.data.length > 0) {
    // Customer exists, update their details
    customer = existingCustomers.data[0];
    await stripe.customers.update(customer.id, {
      name: name,
      address: {
        line1: address,
        city: city,
        country: country,
        postal_code: zip_code,
        state: province,
      },
      phone: phone_number,
      metadata: {
        userId: user_id_req,
        country: country,
      },
    });
  } else {
    // Customer does not exist, create a new one
    customer = await stripe.customers.create({
      email: customeremail,
      payment_method: paymentMethodId,
      name: name,
      address: {
        line1: address,
        city: city,
        country: country,
        postal_code: zip_code,
        state: province,
      },
      phone: phone_number,
      metadata: {
        userId: user_id_req,
        country: country,
      },
    });

    if (!prevCard) {
      // Attach the payment method and set it as the default payment method
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }
  }

  return customer.id;
};

const handlePaymentIntent = async (
  price,
  paymentMethodId,
  stripeCustomerId
) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: price * 100,
    currency: "usd",
    customer: stripeCustomerId,
    payment_method: paymentMethodId,
    confirm: true,
  });

  return paymentIntent;
};

const checkUserData = async (customeremail) => {
  const userDataCheck = await pool.query("SELECT * FROM users WHERE email=$1", [
    customeremail,
  ]);
  return userDataCheck.rows[0];
};

const checkPricingData = async (price_id) => {
  const pricingDataCheck = await pool.query(
    "SELECT * FROM pricing WHERE pricing_id=$1",
    [price_id]
  );
  return pricingDataCheck.rows[0];
};

const updateUserPlan = async (
  company_admin_user_id,
  price_id,
  customeremail,
  current_token,
  expirationTimestamp,
  price,
  duration,
  paymentMethodId,
  stripeCustomerId,
  teamMembers
) => {
  const userPlanCheck = await pool.query(
    "SELECT * FROM user_plan WHERE user_id=$1",
    [company_admin_user_id]
  );

  await pool.query(
    `
    INSERT INTO transaction_history (user_id, plan_id, email, subscription_start_date, subscription_end_date, amount, type, status, transaction_id, stripe_customer_id, members)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
    [
      company_admin_user_id,
      price_id,
      customeremail,
      current_token,
      expirationTimestamp,
      price,
      duration,
      "Active",
      paymentMethodId,
      stripeCustomerId,
      teamMembers,
    ]
  );

  if (userPlanCheck.rows.length === 0) {
    await pool.query(
      `
      INSERT INTO user_plan (user_id, plan_id, subscription_start_date, subscription_end_date, amount, type, status, transaction_id,stripe_customer_id, members)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9,$10)
      `,
      [
        company_admin_user_id,
        price_id,
        current_token,
        expirationTimestamp,
        price,
        duration,
        "Active",
        paymentMethodId,
        stripeCustomerId,
        teamMembers,
      ]
    );
  } else {
    await pool.query(
      `
      UPDATE user_plan 
      SET plan_id = $2, subscription_start_date = $3, subscription_end_date = $4, amount = $5, type = $6, status = $7, transaction_id = $8,stripe_customer_id=$10, members = $9
      WHERE user_id = $1
      `,
      [
        company_admin_user_id,
        price_id,
        current_token,
        expirationTimestamp,
        price,
        duration,
        "Active",
        paymentMethodId,
        teamMembers,
        stripeCustomerId,
      ]
    );
  }
};

const handleErrors = (error, res) => {
  if (error.code === "card_declined") {
    res.json({
      error: true,
      message: error.raw.message,
      errorDetail: error,
    });
  } else if (
    error.code === "expired_card" ||
    error.code === "incorrect_cvc" ||
    error.code === "processing_error" ||
    error.code === "incorrect_number" ||
    error.code === "authentication_required"
  ) {
    res.json({ error: true, message: error.raw.message, errorDetail: error });
  } else {
    res.json({
      error: true,
      errorDetail: error,
      message: error.message,
    });
  }
};
async function updateCustomerDetails(customerId, details) {
  if (!customerId || !details) {
    throw new Error("customerId and details are required");
  }

  try {
    const customer = await stripe.customers.update(customerId, {
      name: details.name,
      phone: details.phone,
      address: {
        line1: details.address.line1,
        city: details.address.city,
        country: details.address.country,
        postal_code: details.address.postal_code,
        state: details.address.state,
      },
    });

    return {
      customer: customer,
      error: false,
      message: "Updated Billing Details.",
    };
  } catch (error) {
    throw new Error("Failed to update customer details");
  }
}

app.post("/create-payment-intent", async (req, res) => {
  try {
    const {
      billingInfo,
      // first_name,
      // last_name,
      // address,
      // city,
      // country,
      // zip_code,
      // province,
      // phone_number,
      teamMembers,
      paymentMethodId,
      customeremail,
      price,
      duration,
      price_id,
      prevCard,
    } = req.body;
    console.log(billingInfo);
    const name = billingInfo.name;
    const address = billingInfo.address.line1;
    const city = billingInfo.address.city;
    const country = billingInfo.address.country;
    const zip_code = billingInfo.address.postal_code;
    const province = billingInfo.address.state;
    const phone_number = billingInfo.phone;

    // const {first_name,last_name,address,city,country,zip_code,province,phone_number}=billingInfo
    const pricingData = await checkPricingData(price_id);
    if (!pricingData) {
      return res.json({ message: "Pricing not found.", error: true });
    }

    let PricingType = pricingData.type;
    let PricingName = pricingData.name;
    let PricingAmount;
    if (duration === "monthly") {
      PricingAmount = pricingData.monthly_price;
    } else {
      PricingAmount = pricingData.yearly_price;
    }

    let userData = await checkUserData(customeremail);
    if (!userData) {
      return res.json({ message: "Email not Found.", error: true });
    }
    let user_id_req = userData.user_id;
    const stripeCustomerId = await createCustomer(
      customeremail,
      paymentMethodId,
      address,
      city,
      country,
      zip_code,
      province,
      phone_number,
      name,
      user_id_req,
      prevCard
    );
    const paymentIntent = await handlePaymentIntent(
      price,
      paymentMethodId,
      stripeCustomerId
    );

    if (paymentIntent.status === "succeeded") {
      const result = await updateCustomerDetails(stripeCustomerId, billingInfo);
      console.log("result");

      console.log(result);
      const company_admin_user_id = userData.user_id;
      let current_token = new Date();
      let expirationTimestamp = new Date();
      duration === "monthly"
        ? expirationTimestamp.setMonth(expirationTimestamp.getMonth() + 1)
        : expirationTimestamp.setFullYear(
            expirationTimestamp.getFullYear() + 1
          );

      if (PricingType === "BIZ") {
        const companyData = await pool.query(
          "SELECT * FROM company WHERE company_admin_email=$1",
          [customeremail]
        );
        if (companyData.rows.length === 0) {
          const addressData = `${address}, ${city}, ${province}, ${zip_code}, ${country}`;
          const billingAddress = true;
          const companyDetails = await pool.query(
            `
            INSERT INTO company (company_email, company_admin_email, status, members, address, contact_no,billingaddress)
            VALUES ($1, $2, $3, $4, $5, $6,$7) RETURNING *
            `,
            [
              customeremail,
              customeremail,
              "inactive",
              teamMembers,
              addressData,
              phone_number,
              billingAddress,
            ]
          );
          const companyId = companyDetails.rows[0].company_id;
          // Update into users the company id and company admin is true
          await pool.query(
            `
            UPDATE users
            SET company_id = $1, company_admin = true
            WHERE email = $2
            `,
            [companyId, customeremail]
          );
        } else {
          const companyId2 = companyData.rows[0].company_id;
          await pool.query(
            `
            UPDATE company 
            SET members = $2
            WHERE company_admin_email = $1
            `,
            [customeremail, teamMembers]
          );
          // Update into users the company id and company admin is true
          await pool.query(
            `
            UPDATE users
            SET company_id = $1, company_admin = true
            WHERE email = $2
            `,
            [companyId2, customeremail]
          );
        }
      }

      await updateUserPlan(
        company_admin_user_id,
        price_id,
        customeremail,
        current_token,
        expirationTimestamp,
        price,
        duration,
        paymentMethodId,
        stripeCustomerId,
        teamMembers
      );
      // make email

      const email = customeremail;
      const plan_name = PricingName;
      const amount = PricingAmount;
      const tax_amount = 0;
      const members = PricingType === "BIZ" ? teamMembers : 1;
      const total = price;
      const subject = "PAID receipt for RequireSign";
      const plan_type = duration;
      // date like format May 29, 2024 -Jun 28, 2024 if duration is monthly or if its yearly then make calculate year after date when it expire
      // Assuming `current_token` and `expiration_token` are JavaScript Date objects
      const options = { year: "numeric", month: "long", day: "numeric" };
      const formattedCurrentToken = current_token.toLocaleDateString(
        undefined,
        options
      );
      const formattedExpirationToken = expirationTimestamp.toLocaleDateString(
        undefined,
        options
      );
      console.log(formattedExpirationToken);
      // make unique invoice number
      const invoiceNumber = `${Math.floor(Math.random() * 1000000)}`;

      const craeteInvoiceD = await createInvoice(
        res,
        invoiceNumber,
        formattedCurrentToken,
        name,
        customeremail,
        plan_name,
        amount,
        tax_amount,
        members,
        duration,
        total,
        formattedExpirationToken,
        paymentMethodId
      );
      console.log("invoive");
      console.log(craeteInvoiceD);
      if (craeteInvoiceD) {
        console.log("invoice created");
        const resetLink = backendUrl + craeteInvoiceD;

        EmailReceipt(
          email,
          resetLink,
          name,
          plan_name,
          amount,
          tax_amount,
          members,
          total,
          subject,
          plan_type,
          formattedCurrentToken,
          formattedExpirationToken,
          paymentMethodId
        );
      }

      //       if(createInvoice.error){
      //         console.log("error")
      //       }else{
      // console.log(craeteInvoice)
      //       }
      // Format the date in the desired format

      // EmailReceipt(
      //   email,
      //   resetLink,
      //   name,
      //   plan_name,
      //   amount,
      //   tax_amount,
      //   members,
      //   total,
      //   subject,
      //   plan_type,
      //   formattedCurrentToken,
      //   formattedExpirationToken,
      //   paymentMethodId
      // );

      // end email
      // get user by user id
      const user = await pool.query("SELECT * FROM users WHERE user_id=$1", [
        user_id_req,
      ]);
      const userDataDeatails = user.rows[0];
      console.log(userDataDeatails);

      res.json({
        error: false,
        message: "Payment has been processed.",
        userData: userDataDeatails,
      });
    } else {
      res.json({ error: true, message: "Payment failed." });
    }
  } catch (error) {
    handleErrors(error, res);
  }
});
// add customer card
app.post("/add-customer-card-stripe", async (req, res) => {
  try {
    const { paymentMethodId, customeremail } = req.body;

    const existingCustomers = await stripe.customers.list({
      email: customeremail,
      limit: 1,
    });

    let customer;

    if (existingCustomers.data.length > 0) {
      // Customer exists
      customer = existingCustomers.data[0];
    } else {
      // Customer does not exist, create new customer
      customer = await stripe.customers.create({
        email: customeremail,
        payment_method: paymentMethodId,
      });
    }

    // Add card to customer's account
    const card = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // Set the new card as the default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.json({ error: false, message: "Card added successfully.", card });
  } catch (error) {
    handleErrors(error, res);
  }
});
app.post("/update-customer-billing", async (req, res) => {
  try {
    const { billingInfo } = req.body;
    // const {
    //   customeremail,
    //   address,
    //   city,
    //   country,
    //   zip_code,
    //   province,
    //   phone_number,
    //   name,
    //   user_id_req,
    // } = req;
    console.log(billingInfo);
    const existingCustomers = await stripe.customers.list({
      email: billingInfo.email,
      limit: 1,
    });

    let customer;
    if (existingCustomers.data.length > 0) {
      // Customer exists, update their details
      customer = existingCustomers.data[0];
      await stripe.customers.update(customer.id, {
        // payment_method: paymentMethodId,
        name: billingInfo.name,
        address: {
          line1: billingInfo.address.line1,
          city: billingInfo.address.city,
          country: billingInfo.address.country,
          postal_code: billingInfo.address.postal_code,
          state: billingInfo.address.state,
        },
        phone: billingInfo.phone,
      });
    } else {
      // Customer does not exist, create a new one
      customer = await stripe.customers.create({
        email: billingInfo.email,
        // payment_method: paymentMethodId,
        name: billingInfo.name,
        address: {
          line1: billingInfo.address.line1,
          city: billingInfo.address.city,
          country: billingInfo.address.country,
          postal_code: billingInfo.address.postal_code,
          state: billingInfo.address.state,
        },
        phone: billingInfo.phone,
      });
    }
    res.json({
      error: false,
      message: "Billing details updated successfully.",
      customer,
    });
  } catch (error) {
    console.log(error);
  }
});

// end

// create api to detach payment method from customer stripe account
app.post("/detach-payment-method", async (req, res) => {
  const paymentMethodId = req.body.paymentMethodId;

  try {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
    res.json({
      error: false,
      message: "Payment method detached successfully.",
    });
  } catch (error) {
    res.json({ error: true, message: error.message });
  }
});
app.post("/get-customer-cards", async (req, res) => {
  const customerId = req.body.customerId;

  if (!customerId) {
    return res.status(400).json({ error: "customerId is required" });
  }

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });
    const customer = await stripe.customers.retrieve(customerId);

    const billingDetails = {
      name: customer.name,
      email: customer.email,
      address: customer.address,
      phone: customer.phone,
    };
    res.json({ cards: paymentMethods.data, billingDetails });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve customer cards" });
  }
});
app.post("/update-customer-details", async (req, res) => {
  const { customerId, details } = req.body;

  if (!customerId || !details) {
    return res
      .status(400)
      .json({ error: "customerId and details are required" });
  }

  try {
    const customer = await stripe.customers.update(customerId, {
      name: `${details.first_name} ${details.last_name}`,
      phone: details.phone_number,
      address: {
        line1: details.address,
        city: details.city,
        country: details.country,
        postal_code: details.zip_code,
        state: details.province,
      },
    });

    res.json({
      customer: customer,
      error: false,
      message: "Updated Billing Details.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: true, message: "Failed to update customer details" });
  }
});



const server = app.listen(PORT, () => {
  console.log(`
################################################
       Server listening on port: ${PORT}
################################################
`);
});
