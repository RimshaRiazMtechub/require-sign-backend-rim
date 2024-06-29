const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3'; // Must be 256 bits (32 characters)
const iv = crypto.randomBytes(16);
const encryptData=(data)=> {
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}
module.exports = encryptData;
