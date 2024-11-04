const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();

router.get('/', (req, res) => {
    res.render('login', {
        oauthid: process.env.OAUTHCLIENTID,
        server_api: process.env.SERVER_API + "/login"
    });
});


router.post('/setup-session', (req, res) => {
    const { userId, name, picture, email, jwtToken } = req.body;
    if (userId) {
        res.cookie('authorization', jwtToken, {maxAge: 1000 * 60 * 60, httpOnly: true});
        req.session.userId = userId; 
        req.session.name = name; 
        req.session.picture = picture;
        req.session.email = email
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

module.exports = router;