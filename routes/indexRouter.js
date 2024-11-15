const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render("./home.ejs", {
        picture: req.userSession.user.picture,
        currentRoute: req.originalUrl,
    })
});

router.get('/about', (req, res) => {
    res.render("./about.ejs", {
        picture: req.userSession.user.picture,
        currentRoute: req.originalUrl,
    })
});


module.exports = router;
