const express = require('express');
const router = express.Router();
const { SessionAuthentication } = require('../public/scripts/auth');
require('dotenv').config();
const sessAuth = new SessionAuthentication(process.env.SESSIONSECRET);

router.get('/dashboard', (req, res) => {
    res.render("./home.ejs", {
        picture: res.locals.picture,
        currentRoute: req.originalUrl,
        userId: res.locals.userId,
    })
});

router.get('/me/library', async (req, res) => {
    res.render("./saved.ejs", {
        picture: res.locals.picture,
        currentRoute: req.originalUrl,
        name: res.locals.name,
    })
});

router.get('/about', (req, res) => {
    res.render("./about.ejs", {
        picture: res.locals.picture,
        currentRoute: req.originalUrl,
    })
});


module.exports = router;
