const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render("./dashboard.ejs", {
        name: req.session.name
    })
});

module.exports = router;
