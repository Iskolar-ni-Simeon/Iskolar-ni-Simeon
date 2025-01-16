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
    const currentYear = new Date().getFullYear();
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')))
    const authCookie = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.authorization, 'base64').toString('utf8')));
    if (query === "" || query === undefined) {
        res.render('./search.ejs', {
            picture: decryptedSession.picture,
            currentRoute: req.originalUrl,
            searchQuery: query,
            sort: sort,
            yearRange,
            yearFrom: yearFrom || '',
            yearTo: yearTo || '',
            errmessage: "No query identified.",
            searchResults: []
        });
        return;
    } else {
        const searchResults = await fetch(`${process.env.SERVER_API}/search?q=${query}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authCookie
            }
        }).then(response => {return response.json()});

        let filteredResults = searchResults.data;
        
        // Apply year filters
        if (yearRange) {
            try {
                switch (yearRange) {
                    case 'last-year':
                        filteredResults = filteredResults.filter(result => 
                            parseInt(result.year) >= currentYear - 1
                        );
                        break;
                    case 'last-5-years':
                        filteredResults = filteredResults.filter(result => 
                            parseInt(result.year) >= currentYear - 5
                        );
                        break;
                    case 'custom':
                        if (!isNaN(yearFrom) && !isNaN(yearTo)) {
                            filteredResults = filteredResults.filter(result => {
                                const year = parseInt(result.year);
                                return year >= yearFrom && year <= yearTo;
                            });
                        }
                        break;
                }
            } catch (error) {
                console.error('Error applying year filter:', error);
            }
        }

        res.render("./search.ejs", {
            picture: decryptedSession.picture,
            currentRoute: req.originalUrl,
            searchQuery: query,
            sort: sort,
            yearRange,
            yearFrom: yearFrom || '',
            yearTo: yearTo || '',
            searchResults: filteredResults,
            errmessage: (!filteredResults || filteredResults.length === 0) ? "No results found." : undefined
        });
    }
});

router.get('/thesis/:id', async (req, res, next) => {
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')))
    const authCookie = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.authorization, 'base64').toString('utf8')));
    try {
        const response = await fetch(`${process.env.SERVER_API}/thesis?uuid=` + req.params.id, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authCookie
            },
            credentials: 'include',
        });

        if (!response.ok) {
            return res.status(response.status).send('Error fetching thesis: ' + response.statusText);
        }

        const thesis = await response.json();

        if (!thesis.data) {
            return res.status(404).render("./404.ejs", {
                picture: decryptedSession.picture,
                currentRoute: req.originalUrl,
            });
        };
        
        res.render("./thesis.ejs", {
            picture: decryptedSession.picture,
            currentRoute: req.originalUrl,
            thesis: thesis.data,
            thesisId: req.params.id,
            server_api: process.env.SERVER_API,
            userId: decryptedSession.userId
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/save/:id', async (req, res, next) => {
    const authCookie = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.authorization, 'base64').toString('utf8')));
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')));
    const method = req.body.method;

    const save = fetch(`${process.env.SERVER_API}/userlibrary`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authCookie
        },
        body: JSON.stringify({
            thesisId: req.params.id,
            userId: decryptedSession.userId,
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
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')));
    const authCookie = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.authorization, 'base64').toString('utf8')));
    try {
        const response = await fetch(`${process.env.SERVER_API}/keyword?uuid=${req.params.keywordId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization' : authCookie
            },
            'credentials': 'include'
        });

        if (!response.ok) {
            if (response.status === 401) {
                return res.redirect('/login');
            }
            return res.status(response.status).render("./404.ejs", {
                picture: decryptedSession.picture,
                currentRoute: req.originalUrl,
            });
        }
        const data = await response.json();
    
        if (!data.ok) {
            res.render("./404.ejs", {
                picture: decryptedSession.picture,
                currentRoute: req.originalUrl,
            });
        }

        res.render('./keyword.ejs', {
            picture: decryptedSession.picture,
            currentRoute: req.originalUrl,
            keyword: data.data,
            searchResults: data.data.theses
        });

    } catch (err) {
        console.error('Error: ', err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/author/:authorId', async (req, res, next) => {
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')));
    const authCookie = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.authorization, 'base64').toString('utf8')));
    try {
        const response = await fetch(`${process.env.SERVER_API}/author?uuid=${req.params.authorId}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authCookie
                },
                'credentials': 'include'
            }
        ).then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    return res.redirect('/login');
                }
                return res.status(response.status).render("./404.ejs", {
                    picture: decryptedSession.picture,
                    currentRoute: req.originalUrl,
                });
            }
            return response
        });

        const data = await response.json();
        res.render('./author.ejs', {
            picture: decryptedSession.picture,
            currentRoute: req.originalUrl,
            author: data.data,
            searchResults: data.data.theses
        })
    } catch (err) {
        console.error('Error: ', err)
    }
});

module.exports = router;