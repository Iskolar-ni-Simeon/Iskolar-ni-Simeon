const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();

router.get('/', (req, res) => {
    res.render('login', {
        oauthid: process.env.OAUTHCLIENTID,
        server_api: "https://ins-api-steel.vercel.app/login",
        origin: process.env.ORIGIN
    });
});

router.post('/setup-session', (req, res) => {
    console.time("Session Setup");

    const { userId, name, picture, email, jwtToken, savedTheses } = req.body;
    if (userId) {
        res.cookie('authorization', jwtToken, { maxAge: 1000 * 60 * 60, httpOnly: true });
        const user = {
            id: userId,
            name: name,
            picture: picture,
            email: email,
            savedTheses: savedTheses
        };
        console.log('Created authorization cookie');
        console.log('Session Data:', user); 

        req.userSession.user = user;

        console.timeEnd("Session Setup");

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