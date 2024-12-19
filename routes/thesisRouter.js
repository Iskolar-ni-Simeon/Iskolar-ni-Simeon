const express = require('express');
const router = express.Router();
const { SessionAuthentication } = require('../public/scripts/auth');
const { Readable } = require('stream');
const crypto = require('crypto');
require('dotenv').config();
const sessAuth = new SessionAuthentication(process.env.SESSIONSECRET);

router.get('/search', async (req, res, next) => {
    const query = req.query.q || "";
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')))
    const authCookie = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.authorization, 'base64').toString('utf8')));
    if (req.query.q === "" || req.query.q === undefined) {
        res.render('./search.ejs', {
            picture: decryptedSession.picture,
            currentRoute: req.originalUrl,
            searchQuery: query,
            errmessage: "No query identified.",
            searchResults: []
        })
    } else {
        const searchResults = await fetch(`${process.env.SERVER_API}/search?q=${query}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authCookie
            }
        }).then(response => {return response.json()});

        res.render("./search.ejs", {
            picture: decryptedSession.picture,
            currentRoute: req.originalUrl,
            searchQuery: query,
            searchResults: searchResults.data,
            errmessage: searchResults.data && searchResults.data.length == [] ? "No results found." : undefined
        });
    }
});

router.get('/advanced', (req, res, next) => {
    const q = req.query.q || "";
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')));
    res.render("./advanced.ejs", {
        picture: decryptedSession.picture,
        currentRoute: req.originalUrl,
        server_api: process.env.SERVER_API,
        query: q
    });
});

router.get('/search/advanced', async (req, res, next) => {
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')));
    const authCookie = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.authorization, 'base64').toString('utf8')));
    const fromTitle = req.query.title;
    const fromAuthor = req.query.authors;
    const fromKeyword = req.query.keywords;
    const fromAbstract = req.query.abstract;
    const startYear = req.query.syear;
    const endYear = req.query.eyear;

    const data = {
        title: fromTitle,
        author: fromAuthor,
        keyword: fromKeyword,
        abstract: fromAbstract,
        syear: startYear,
        eyear: endYear
    };

    console.log(data)
    try {
        if (Object.values(data).every(value => value === undefined || value === "")) {
            console.log('no query found')
            res.render('./advancedsearch.ejs', {
                picture: decryptedSession.picture,
                searchResults: [], 
                currentRoute: req.originalUrl,
                errmessage: "No query identified.",
            });
        } else {
            try {
                const searchResults = await fetch(`${process.env.SERVER_API}/advanced`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": authCookie
                    },
                    body: JSON.stringify({
                        titleContains: data.title,
                        absContains: data.abstract,
                        authors: data.author,
                        keywords: data.keyword,
                        beforeYear: data.syear,
                        afterYear: data.eyear
                    }),
                    credentials: 'include'
                }).then(res => {return res.json()})
    
                console.log("search results:", JSON.stringify(searchResults.data))

                if (searchResults.data && searchResults.data.length == 0) {
                    console.log(searchResults.data)
                    res.render("./advancedsearch.ejs", {
                        picture: decryptedSession.picture,
                        currentRoute: req.originalUrl,
                        searchResults: searchResults.data || [],
                        errmessage: searchResults.data && searchResults.data.length == [] ? "No results found." : undefined
                    });
                } else {
                    res.render("./advancedsearch.ejs", {
                        picture: decryptedSession.picture,
                        currentRoute: req.originalUrl,
                        searchResults: searchResults.data || [],
                        errmessage: searchResults.data && searchResults.data.length == [] ? "No results found." : undefined
                    });
                }
            } catch (err) {
                res.render("./advancedsearch.ejs", {
                    picture: decryptedSession.picture,
                    currentRoute: req.originalUrl,
                    server_api: process.env.SERVER_API,
                    searchResults: [],
                    errmessage: err
                });
            }
        }
        
    } catch (err) {
        res.render("./advancedsearch.ejs", {
            picture: decryptedSession.picture,
            currentRoute: req.originalUrl,
            server_api: process.env.SERVER_API,
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