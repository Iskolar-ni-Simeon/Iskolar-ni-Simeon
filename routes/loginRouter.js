const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();

router.get('/', (req, res) => {
    res.render('login', {
        oauthid: process.env.OAUTHCLIENTID 
    });
});


router.post('/setup-session', (req, res) => {
    const { userId, name, picture, email} = req.body;
    if (userId) {
        const jwtToken = jwt.sign(
            {
                userId: userId,
                email: email,
                exp: Math.floor(Date.now() / 1000) + (60 * 60)
            },
            `${process.env.JWT_SECRET}`
        )
        res.cookie('authorization', jwtToken, {maxAge: 3600, httpOnly: true});
        req.session.userId = userId; 
        req.session.name = name; 
        
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
