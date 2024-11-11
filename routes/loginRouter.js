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
    const { userId, name, picture, email, jwtToken, savedTheses } = req.body;
    if (userId) {
        res.cookie('authorization', jwtToken, { 
            maxAge: 1000 * 60 * 60, 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'  // Can also be 'Lax' depending on your needs
        });
        
        // Store user details in session (server-side)
        req.session.userId = userId; 
        req.session.name = name; 
        req.session.picture = picture;
        req.session.email = email;
        req.session.savedTheses = savedTheses;
        
        console.log(`Session created for user: ${req.session.userId}`);
        req.session.save(err => {
            if (err) {
                console.error("Error saving session:", err);
                return res.status(500).send("Error saving session");
            }
            res.status(200).send("Session created");
        });
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