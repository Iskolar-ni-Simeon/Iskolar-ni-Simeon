const express = require('express');
const jwt = require('jsonwebtoken');
const { SessionAuthentication } = require('../public/scripts/auth');
const router = express.Router();
require('dotenv').config();

const sessAuth = new SessionAuthentication(process.env.SESSIONSECRET);

router.get('/', (req, res) => {
    res.render('login', {
        oauthid: process.env.OAUTHCLIENTID,
        server_api: "https://ins-api-steel.vercel.app/login",
        origin: process.env.ORIGIN
    });
});

router.post('/setup-session', (req, res) => {
    const { userId, name, picture, email, jwtToken, savedTheses} = req.body;
    if (userId) {
        res.cookie('authorization', jwtToken, { maxAge: 1000 * 60 * 60, httpOnly: true });
        const sessionData = {
            userId,
            name,
            picture,
            email,
            savedTheses
        };
        const encryptedData = Buffer.from(JSON.stringify(sessAuth.encrypt(sessionData))).toString('base64')
        res.cookie('session', encryptedData, { maxAge: 1000 * 60 * 60, httpOnly: true, sameSite: 'strict' });
        res.status(200).send("Session setup successful");
    } else {
        console.log("Invalid user data");
        res.status(400).send("Invalid user data");
    }
});



router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Error destroying session");
        }
        res.clearCookie('authorization');
        res.redirect('/login');
    });
});

module.exports = router;