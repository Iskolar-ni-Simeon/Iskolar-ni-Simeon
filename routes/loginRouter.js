const express = require('express');
const jwt = require('jsonwebtoken');
const { SessionAuthentication } = require('../public/scripts/auth');
const router = express.Router();
require('dotenv').config();

const sessAuth = new SessionAuthentication(process.env.SESSIONSECRET);

router.get('/login', (req, res) => {
    const origin = process.env.origin
    res.render('login', {
        oauthid: process.env.OAUTHCLIENTID,
        server_api: `${process.env.SERVER_API}`,
        guest_api_key: process.env.LIBRARY_API_KEY,
        origin: origin,
        isLibraryPort: process.env.PORT === "library",
    });
});

router.post('/setup-session', (req, res) => {
    const { userId, name, picture, jwtToken } = req.body;
    if (userId) {
        const encryptedAuthCookie = Buffer.from(JSON.stringify(sessAuth.encrypt(jwtToken))).toString('base64');
        res.cookie('authorization', encryptedAuthCookie, { 
            maxAge: 1000 * 60 * 60, 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        const sessionData = {
            userId,
            name,
            picture
        };
        const encryptedData = Buffer.from(JSON.stringify(sessAuth.encrypt(sessionData))).toString('base64');
        res.locals = sessionData;
        res.cookie('session', encryptedData, { 
            maxAge: 1000 * 60 * 60, 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        res.status(200).send("Session setup successful");
    } else {
        res.status(400).send("Invalid user data");
    }
});

router.post('/guest-session', (req, res) => {
    console.log(req.body)
    const { jwtToken } = req.body;
    
    if (!jwtToken) {
        return res.status(400).send("Invalid guest token");
    }

    const encryptedAuthCookie = Buffer.from(JSON.stringify(sessAuth.encrypt(jwtToken))).toString('base64');
    res.cookie('authorization', encryptedAuthCookie, { 
        maxAge: 1000 * 60 * 60, 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });

    const sessionData = {
        userId: 'guest',
        name: 'Guest User',
        picture: '/images/guest.png'
    };
    res.locals = sessionData;
    const encryptedData = Buffer.from(JSON.stringify(sessAuth.encrypt(sessionData))).toString('base64');
    res.cookie('session', encryptedData, { 
        maxAge: 1000 * 60 * 60, 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    
    res.status(200).send("Guest session setup successful");
});

router.get('/logout', (req, res) => {
    res.clearCookie('authorization');
    res.clearCookie('session');
    res.clearCookie('savedThesis');
    res.redirect('/auth/login');

});

module.exports = router;