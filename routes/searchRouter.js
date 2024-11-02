const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    const query = req.query.q || "";
    const author = req.query.author || "";

    response = fetch("http://127.0.0.1:5000/search" + new URLSearchParams({
        q: query,
        author: author
    }))
    .then(response => {
        if (!response.ok) {
            const response = "error"
        }
        console.log(response)
        return response.json();
    })
    .then(data => {
        return data
    })
    res.render("./search.ejs", {
        response: response
    })
})

module.exports = router;