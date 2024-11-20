const express = require('express');
const router = express.Router();
const { SessionAuthentication } = require('../public/scripts/auth');
require('dotenv').config();
const sessAuth = new SessionAuthentication(process.env.SESSIONSECRET);

router.get('/', (req, res) => {
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(decodeURIComponent(req.cookies.session), 'base64').toString('utf8')));
    res.render("./home.ejs", {
        picture: decryptedSession.picture,
        currentRoute: req.originalUrl,
    })
});

router.get('/me/library', (req, res) => {
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(decodeURIComponent(req.cookies.session), 'base64').toString('utf8')));
    const userId = decryptedSession.userId;
    res.render("./saved.ejs", {
        picture: decryptedSession.picture,
        currentRoute: req.originalUrl,
        name: decryptedSession.name,
        serverAPI : process.env.SERVER_API,
        userId : userId
    })
});

router.get('/about', (req, res) => {
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(decodeURIComponent(req.cookies.session), 'base64').toString('utf8')));
    res.render("./about.ejs", {
        picture: decryptedSession.picture,
        currentRoute: req.originalUrl,
    })
});


module.exports = router;
