//kung ako nalang sana ang iyong minahal
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

router.get('/me/library', async (req, res) => {
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(decodeURIComponent(req.cookies.session), 'base64').toString('utf8')));
    const userId = decryptedSession.userId;
    const authCookie = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.authorization, 'base64').toString('utf8')));
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 6; // Changed from 10 to 6
    let error;
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
            picture: decryptedSession.picture,
            currentRoute: req.originalUrl,
            name: decryptedSession.name,
            searchResults: paginatedResults,
            errmessage: 'You have no saved theses. Click the <strong>save</strong> button when you find a thesis you like to save it here.',
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
});

router.get('/about', (req, res) => {
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(decodeURIComponent(req.cookies.session), 'base64').toString('utf8')));
    res.render("./about.ejs", {
        picture: decryptedSession.picture,
        currentRoute: req.originalUrl,
    })
});


module.exports = router;
