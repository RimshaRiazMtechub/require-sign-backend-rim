const nodemailer = require('nodemailer');


function generateLicenseKey (){
    const keyParts = [];
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (let i = 0; i < 5; i++) {
      let part = '';
      for (let j = 0; j < 5; j++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        part += characters.charAt(randomIndex);
      }
      keyParts.push(part);
    }
  
    return keyParts.join('-');
}
module.exports = generateLicenseKey;