const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const cookieSession = require('cookie-session');
require('dotenv').config();

router.get('/', (req, res) => {
    console.log(req.session)
    res.render('login', {
        oauthid: process.env.OAUTHCLIENTID,
        server_api: "https://ins-api-steel.vercel.app/login",
        origin: process.env.ORIGIN
    });
});


router.post('/setup-session', (req, res) => {
    const { userId, name, picture, email, jwtToken, savedTheses } = req.body;
    
    if (userId) {
        res.cookie('authorization', jwtToken, { maxAge: 1000 * 60 * 60, httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        const session = {
            userId: userId,
            name: name,
            picture: picture,
            email: email,
            savedTheses: savedTheses
        }
        req.session = session;
        console.log(`Session created for user: ${req.session.userId}`);
        res.status(200).send("Session created");
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