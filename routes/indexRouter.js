//kung ako nalang sana ang iyong minahal
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
    const userId = res.locals.userId;
    const authCookie = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.authorization, 'base64').toString('utf8')));
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 6; // Changed from 10 to 6
    let error;
    console.log(res.locals)
    if (res.locals.userId.split('-')[0] === 'guest') {
        res.render("./saved.ejs", {
            picture: res.locals.picture,
            currentRoute: req.originalUrl,
            name: res.locals.userId,
            searchResults: [],
            errmessage: "Login to enable this functionality.",
            pagination: {
                currentPage: page,
                totalPages: 0,
                hasNext: page < 0,
                hasPrev: page > 1
            }
        })
    } else {
        try {
            const searchResults = await fetch(`${process.env.SERVER_API}/userlibrary?id=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization' : authCookie
                }
            }).then(response => {
                if (!response.ok) {
                    error = response.statusText;
                    return response.json();
                }
                return response.json();
            })
    
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const totalItems = searchResults.data.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            const paginatedResults = searchResults.data.slice(startIndex, endIndex);
    
            res.render("./saved.ejs", {
                picture: res.locals.picture,
                currentRoute: req.originalUrl,
                name: res.locals.name,
                searchResults: paginatedResults,
                errmessage: (res.locals.userId.split('-')[0] === "guest") ? "Login to enable this functionality." : "You have no saved items. Click the <strong>save</strong> button on the search results to save an item.",
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            })
        } catch (err) {
            console.log(err);
        };
    }

});

router.get('/about', (req, res) => {
    res.render("./about.ejs", {
        picture: res.locals.picture,
        currentRoute: req.originalUrl,
    })
});


module.exports = router;
