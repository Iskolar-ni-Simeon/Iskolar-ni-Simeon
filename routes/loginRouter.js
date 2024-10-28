const express = require('express');
const router = express.Router();
require('dotenv').config();

router.get('/', (req, res) => {
    res.render('login', {
        oauthid: process.env.OAUTHCLIENTID // Your OAuth client ID from environment
    });
});

// Assume /setup-session is defined here to handle session creation after Google login
router.post('/setup-session', (req, res) => {
    const { userId, name } = req.body; // Get user ID and name from the request body
    if (userId) {
        req.session.userId = userId; // Store userId in session
        req.session.name = name; // Optionally store name in session
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
