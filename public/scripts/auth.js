const crypto = require('crypto');
require('dotenv').config();

class SessionAuthentication {
    constructor (password) {
        const salt = process.env.SALT
        this.key = crypto.scryptSync(password, salt, 32);
    };

    encrypt(data) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);

        const json = JSON.stringify(data);
        const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return {
            iv: iv.toString('hex'),
            content: encrypted.toString('hex'),
            tag: authTag.toString('hex')
        };
    };

    decrypt(data) {
        const iv = Buffer.from(data.iv, 'hex');
        const authTag = Buffer.from(data.tag, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(data.content, 'hex')),
            decipher.final()
        ]);
        
        return JSON.parse(decrypted.toString('utf8'));
    }
}

module.exports = {SessionAuthentication}