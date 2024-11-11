const crypto = require('crypto');

console.log(crypto.randomBytes(128).toString('hex'));