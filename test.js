const crypto = require('crypto');

// Generate a random 32-byte key in hexadecimal format
const secretKey = crypto.randomBytes(32).toString('hex');

console.log(`Your generated SECRET_KEY: ${secretKey}`);