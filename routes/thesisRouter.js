// ganyan ka eh
const express = require('express');
const router = express.Router();
const { SessionAuthentication } = require('../public/scripts/auth');
const { Readable } = require('stream');
const crypto = require('crypto');
require('dotenv').config();
const sessAuth = new SessionAuthentication(process.env.SESSIONSECRET);

router.get('/search', async (req, res, next) => {
    const query = req.query.q || "";
    const sort = req.query.sort || "relevance"; 
    const yearRange = req.query.yearRange;
    const yearFrom = parseInt(req.query.yearFrom);
    const yearTo = parseInt(req.query.yearTo);
    const type = req.query.type;
    
    res.render("./search.ejs", {
        picture: res.locals.picture,
        currentRoute: req.originalUrl,
        searchQuery: query,
        sort: sort,
        yearRange,
        yearFrom: yearFrom || '',
        yearTo: yearTo || '',
        type: type || '', 
        userId: res.locals.userId
    });
});

router.get('/thesis/:id', async (req, res, next) => {
    res.render("./thesis.ejs", {
        picture: res.locals.picture,
        currentRoute: req.originalUrl,
        thesisId: req.params.id,
        server_api: process.env.SERVER_API,
        userId: res.locals.userId
    });
});

router.post('/save/:id', async (req, res, next) => {
    if (res.locals.userId.split('-')[0] === 'guest') {
        return res.status(403).json({
            ok: false,
            message: 'Guest users cannot save theses'
        });
    }

    const authCookie = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.authorization, 'base64').toString('utf8')));
    const method = req.body.method;

    const save = fetch(`${process.env.SERVER_API}/userlibrary`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authCookie
        },
        body: JSON.stringify({
            thesisId: req.params.id,
            userId: res.locals.userId,
            method: method
        })
    }).then(response => {return response.json()});
    
    return res.json(await save);

})

router.get('/read/:id', async (req, res, next) => {
    const token = crypto.createHmac('sha256', process.env.FILE_SECRET_KEY)
                        .update(req.params.id)
                        .digest('hex');
    

    res.render('./read.ejs', {
        title: 'Read Thesis',
        pdfLink: `/read/proxy/${req.params.id}?token=${token}`,
        thesisId: req.params.id,
    });
});


router.get('/read/proxy/:id', async (req, res, next) => {
    const { token } = req.query;
    const referer = req.get('Referer');
    if (!token || !referer || !referer.includes(`/read/`)) {
        res.redirect('/404')
    } else {

        const expectedToken = crypto.createHmac('sha256', process.env.FILE_SECRET_KEY)
                                    .update(req.params.id)
                                    .digest('hex');

        if (token !== expectedToken) {
            return res.status(403).send('Invalid token');
        }

        const authCookie = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.authorization, 'base64').toString('utf8')));

        try {
            const response = await fetch(`${process.env.SERVER_API}/accessthesis?uuid=${req.params.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authCookie
                },
                'credentials': 'include'
            });

            if (!response.ok) {
                return res.status(response.status).send('Failed to fetch the thesis metadata');
            }
            const thesisData = await response.json();

            if (!thesisData.ok || !thesisData.data) {
                return res.status(404).send('PDF URL not found');
            }

            const pdfUrl = thesisData.data;

            const pdfResponse = await fetch(pdfUrl, {
                method: 'GET',
                'credentials': 'include'
            });

            if (!pdfResponse.ok) {
                return res.status(pdfResponse.status).send('Failed to fetch the PDF file');
            }

            const pdfStream = Readable.from(pdfResponse.body);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
            pdfStream.pipe(res);
        } catch (err) {
            console.error('Error: ', err);
            res.status(500).send('Internal Server Error');
        }
    };
});

router.get('/keyword/:keywordId', async (req, res, next) => {
    const keywordId = req.params.keywordId;
    res.render('./keyword.ejs', {
        picture: res.locals.picture,
        currentRoute: req.originalUrl,
        userId: res.locals.userId,
        keywordId: keywordId
    })
});

router.get('/author/:authorId', async (req, res, next) => {
    const authorId = req.params.authorId;
    res.render('./author.ejs', {
        picture: res.locals.picture,
        currentRoute: req.originalUrl,
        userId: res.locals.userId,
        authorid: authorId
    })
});

module.exports = router;