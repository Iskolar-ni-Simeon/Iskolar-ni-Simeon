const express = require('express');
const router = express.Router();

// This route should be protected by the authMiddleware
router.get('/', (req, res) => {
    res.render("./dashboard.ejs", {
        name: req.session.name
    })
});

module.exports = router;
