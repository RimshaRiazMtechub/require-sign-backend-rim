
CREATE SEQUENCE IF NOT EXISTS my_sequence START 100000;

CREATE TABLE IF NOT EXISTS users(
  user_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  company_name TEXT,
  company_id TEXT,
  company_user Boolean,
  company_admin Boolean,
  contact_no TEXT,
  avatar TEXT,
  activatedPlan TEXT,
  password TEXT,
  is_verified TEXT,
  is_active TEXT,
  stripe_cust_id TEXT,
  last_Login TEXT,
  disk_usage TEXT,
  signature_image_url TEXT,
  referal_code TEXT,
  total_doc TEXT,
  last_login_IP TEXT,
  total_bulk_links TEXT,
  first_time_logged_in TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS pricing(
  pricing_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  name TEXT,
  type TEXT ,
  document_to_sign TEXT,
  unlimited_sending BOOLEAN,
  bulk_link TEXT,
  template TEXT,
  no_of_users TEXT,
  branding TEXT,
  subdomain TEXT,
  custom_hosting TEXT,
  monthly_price TEXT,
  yearly_price TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()

);
CREATE TABLE IF NOT EXISTS feature(
  feature_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  pricing_id TEXT,
  description TEXT ,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()

);
CREATE TABLE IF NOT EXISTS dedicated_server_req (
  req_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  company_email TEXT,
  company_name TEXT,
  contact_no TEXT,
  description TEXT,
  max_user_limit TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
 
);
CREATE TABLE IF NOT EXISTS verificationuseremail(
  verify_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  email TEXT,
  expiry_token TEXT,
  current_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_plan(
  user_plan_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  plan_id TEXT,
  user_id TEXT,
  subscription_start_date TEXT,
  subscription_end_date TEXT,
  amount TEXT,
  members TEXT,
  type TEXT,
  status TEXT,
  transaction_id TEXT,
   stripe_customer_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()

 );
 CREATE TABLE IF NOT EXISTS contact_us(
  enquiry_no INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  name TEXT,
  email TEXT ,
  phone_no TEXT,
  type TEXT,
  received_on TEXT,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()

);
 CREATE TABLE IF NOT EXISTS static_pages(
  page_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  page_name TEXT,
  language TEXT ,
  page_title TEXT,
  keyword TEXT,
  meta_description TEXT,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()

);
CREATE TABLE IF NOT EXISTS referal_code(
  referal_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  company_name TEXT,
  referal_code TEXT ,
  company_email TEXT,
  expiry BOOLEAN,
  expiry_date TEXT,
  status Boolean,
  organization_contact_no TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()

);
CREATE TABLE IF NOT EXISTS company(
  company_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  company_name TEXT,
  company_email TEXT,
  contact_no TEXT,
  branding TEXT,
  address TEXT,
  website_link TEXT,
  company_admin_email TEXT,
  password TEXT,
  members TEXT,
  subdomain_name TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  company_logo TEXT,
  billingaddress Boolean,
  -- selected_plan TEXT,
  -- mode_of_payment TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS subdomain(
  subdomain_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  name TEXT,
  company_id TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  company_logo TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS license_key(
  license_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  company_id TEXT,
  company_email TEXT,
  subdomain TEXT,
  company_logo TEXT,
  activatedPlan TEXT,
  contact_no TEXT,
  max_user_limit TEXT,
  support boolean,
  has_subdomain boolean,
  is_verified TEXT,
  -- image TEXT,
  subdomain_name TEXT,
  color_settings jsonb[],
  support_email TEXT,
    is_active TEXT,
  stripe_cust_id TEXT,
  -- primary_color TEXT,
  -- secondary_color TEXT,
  -- tertiary_color TEXT,
  -- quatemary_color TEXT,
  status TEXT
  -- company_admin jsonb[]

);


CREATE TABLE IF NOT EXISTS verification(
  verify_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  email TEXT,
location_country TEXT,
ip_address TEXT,
location_date TEXT,
timezone TEXT,
 created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS Folder(
  folder_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  user_id TEXT,
  folder_name TEXT,
  uniq_id TEXT,
  subFolder Boolean,
  subFolder_id TEXT,
  color TEXT,
  status TEXT,
  is_deleted BOOLEAN,
  is_trash_deleted BOOLEAN,
  is_archieved BOOLEAN,
  archieved_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS Files(
 file_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  only_signer TEXT,                
  uniq_id TEXT,
  subfolder Boolean,
  subfolder_id TEXT,
  status TEXT,
  email_subject TEXT,
  email_message TEXT,
  signer_functional_controls TEXT,
  secured_share TEXT,
  set_esigning_order TEXT,
  is_deleted BOOLEAN,
  is_trash_deleted BOOLEAN,
  is_archieved BOOLEAN,
  archieved_at TIMESTAMP,
  deleted_at TIMESTAMP,
  send_esign_at TEXT,
  ip_address TEXT,
  ip_country TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bgimgs(
  bgimgs_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  file_id TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS template_bg_imgs(
  template_bg_imgs_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  template_id TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS positions(
  positions_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  file_id TEXT,
  position_array jsonb[],
  height TEXT,
  width TEXT,
  type TEXT,
  url TEXT,
  xaxis TEXT,
  yaxis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS bulk_link_positions(
  positions_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  bulk_link_id TEXT,
  position_array jsonb[],
  height TEXT,
  width TEXT,
  type TEXT,
  url TEXT,
  xaxis TEXT,
  yaxis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS template_positions(
  positions_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  template_id TEXT,
  position_array jsonb[],
  height TEXT,
  width TEXT,
  type TEXT,
  url TEXT,
  xaxis TEXT,
  yaxis TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_signatures(
  user_signature_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  signature_image_url TEXT,
  user_id TEXT,
  type TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS signer(
  signer_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  file_id TEXT,
  name TEXT,
  email TEXT,
  completed_status TEXT,
  completed_at TEXT,
  color TEXT,
  order_id TEXT,
  access_code TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS recipient(
  recipient_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  file_id TEXT,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS terms_and_condtions(
  terms_and_condition_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  TEXT TEXT,
  status TEXT DEFAULT 'inactive',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS privacy_policy(
  privacy_policy_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  TEXT TEXT,
  status TEXT DEFAULT 'inactive',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS about_us(
  about_us_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  TEXT TEXT,
  status TEXT DEFAULT 'inactive',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- subscription 
CREATE TABLE IF NOT EXISTS transaction_history(
  transaction_history_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  user_id TEXT,
  plan_id TEXT,
  email TEXT,
  subscription_start_date TEXT,
  subscription_end_date TEXT,
  amount TEXT,
  type TEXT,
  members TEXT,
  status TEXT,
  transaction_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS bulk_links(
  bulk_link_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  user_id TEXT,
  uniq_id TEXT,
  title TEXT,
  welcome_message TEXT,
  acknowledgement_message TEXT,
  response TEXT,
  limit_responses TEXT,
  link_response_limit TEXT,
  total_responses TEXT,
  expiry_date TEXT,
  expires_option TEXT,
  file_name TEXT,
  file_url TEXT,
  url TEXT,
  editable BOOLEAN,
  status TEXT,
  signer_functional_controls TEXT,
  user_email_verification TEXT,
  allow_download_after_submission TEXT,
  users_receive_copy_in_email TEXT,  -- corrected column name
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS template(
  template_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  user_id TEXT,
  file_name TEXT,
  uniq_id TEXT,
  url TEXT,
  file_url TEXT,
  status TEXT,
  is_deleted BOOLEAN,
  is_trash_deleted BOOLEAN,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS bulk_link_responses(
  bulk_link_response_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  email TEXT,
  bulk_link_id TEXT,
  position_array jsonb[],
  pdf_link TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS template_responses(
  template_responses_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  email TEXT,
  user_id TEXT,
  subject TEXT,
  message TEXT,
  title TEXT,
  template_id TEXT,
  completed_at TEXT,
  timezone TEXT,
  completed TEXT,
  position_array jsonb[],
  created_at_date TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS audit_log(
  audit_log_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  user_id TEXT,
  event TEXT,
  location_country TEXT,
  ip_address TEXT,
  location_date TEXT,
  timezone TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS file_log(
  file_log_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  file_id TEXT,
  user_id TEXT,
  email TEXT,
  event TEXT,
  location_country TEXT,
  description TEXT,
  ip_address TEXT,
  location_date TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS bulk_link_log(
  bulk_link_log_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  bulk_link_id TEXT,
  email TEXT,
  event TEXT,
  location_country TEXT,
  description TEXT,
  ip_address TEXT,
  location_date TEXT,
  timezone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS template_log(
  template_log_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  template_id TEXT,
  email TEXT,
  event TEXT,
  location_country TEXT,
  description TEXT,
  ip_address TEXT,
  location_date TEXT,
  user_shared_email TEXT,
  timezone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS admin(
  admin_id INT NOT NULL DEFAULT nextval('my_sequence') PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  contact_no TEXT,
  website_link TEXT,
  image TEXT,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Check if a user with type 'admin' exists
SELECT COUNT(*) FROM admin WHERE email = 'testing.mtechub@gmail.com';
      
-- If a user with type 'admin' exists, update the user

-- If no user with type 'admin' exists, insert a new user
INSERT INTO admin (admin_id,first_name,last_name, email,password,status)
-- password : mtechub123
SELECT nextval('my_sequence'), 'admin','', 'testing.mtechub@gmail.com','a1d0c18e4f4f3cd8d6d14532b3d0450cf9a48ec2a5309960c4e706864839314f','active'
WHERE NOT EXISTS (SELECT 1 FROM admin WHERE email = 'testing.mtechub@gmail.com');

-- If the pricing table is empty, insert a new row
INSERT INTO pricing (name, type, document_to_sign, unlimited_sending, bulk_link, template, no_of_users, branding, subdomain, custom_hosting, monthly_price,yearly_price)
SELECT 'Free Individual', 'FREE', '10', true, 'no', 'no', '1', 'no', 'no', 'no', '0', '0'
WHERE NOT EXISTS (SELECT 1 FROM pricing WHERE type = 'FREE');

-- add one more row 
INSERT INTO pricing (name, type, document_to_sign, unlimited_sending, bulk_link, template, no_of_users, branding, subdomain, custom_hosting, monthly_price,yearly_price)
SELECT 'Pro Individual', 'PRO', 'unlimited', true, 'unlimited', 'unlimited', '1', 'yes', 'no', 'no', '7', '59'
WHERE NOT EXISTS (SELECT 1 FROM pricing WHERE type = 'PRO');

INSERT INTO pricing (name, type, document_to_sign, unlimited_sending, bulk_link, template, no_of_users, branding, subdomain, custom_hosting, monthly_price,yearly_price)
SELECT 'Biz Team', 'BIZ', 'unlimited', true, 'unlimited', 'unlimited', 'unlimited', 'yes', 'yes', 'yes', '6', '49'
WHERE NOT EXISTS (SELECT 1 FROM pricing WHERE type = 'BIZ');



