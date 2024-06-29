// urls.js
const ApiUrl = "http://localhost:3000";
const BackendApiUrl = "http://localhost:3003";
// const ApiUrl = "https://requiresign.com/";
// const BackendApiUrl = "https://backend.requiresign.com/";

// const ApiUrl = 'https://requiresign.com/'

// const baseUrl='https://64f08b5d1f93a1121bb51a0f--venerable-syrniki-24ae89.netlify.app'

const urls = {
  backendUrl: `${BackendApiUrl}/`,

  email_verification_url: `${ApiUrl}/verifyEmail`,
  stripe_payment_company: `${ApiUrl}/stripe_payment_company`,

  email_verification_company_url: `${ApiUrl}/verifyCompanyEmail`,
  login_url: `${ApiUrl}/`,
  renew_subscription_url: `${ApiUrl}/stripe_plan`,
  password_update_user_url: `${ApiUrl}/update_password`,
  password_create: `${ApiUrl}/create_password_company`,

  password_update_admin_url: `${ApiUrl}/update_password_admin`,
  urlApid: `${BackendApiUrl}/`,
  sendDocToESign: `${ApiUrl}/send-doc-to-esign`,
  completedDocument: `${ApiUrl}/waiting_for_others_doc/file`,
  recipientDocument: `${ApiUrl}/received_doc/file`,
  templateDocument: `${ApiUrl}/get_shared_template`,
  // FOR email templates
  support_email: "helpdesk@requiresign.com",
  facebook_url: "https://www.facebook.com/pixinvents",
  twitter_url: "https://twitter.com/pixinvents",
  instagram_url: "https://www.instagram.com/pixinvents",
  // rimshanimo22@getMaxListeners.com cloudinary
  facebook_image_url:
    "https://res.cloudinary.com/dlm56y4v4/image/upload/v1706182636/Icons_vc3lke.png",
  twitter_image_url:
    "https://res.cloudinary.com/dlm56y4v4/image/upload/v1706182673/twitter_black_jtv4un.png",
  instagram_image_url:
    "https://res.cloudinary.com/dlm56y4v4/image/upload/v1706182672/instagram_black_bhgmly.png",
  // END email templates

  // Add more URLs here if needed
};

module.exports = urls;
