const express = require('express');
const router = express.Router();
const { SessionAuthentication } = require('../public/scripts/auth');
const { Readable } = require('stream');
require('dotenv').config();
const sessAuth = new SessionAuthentication(process.env.SESSIONSECRET);

router.get('/search', (req, res, next) => {
    const query = req.query.q || "";
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')))
    res.render("./search.ejs", {
        picture: decryptedSession.picture,
        currentRoute: req.originalUrl,
        token: req.cookies.authorization,
        server_api: process.env.SERVER_API,
        searchQuery: query
    });
});

router.get('/thesis/:id', async (req, res, next) => {
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')))
    try {
        const response = await fetch(`${process.env.SERVER_API}/thesis?uuid=` + req.params.id, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.cookies.authorization}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                return res.redirect('/login');
            }
            return res.status(response.status).send('Error fetching thesis');
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
            thesisId: req.params.id
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/read/:id', async (req, res, next) => {
    try {
        const response = await fetch(`${process.env.SERVER_API}/accessthesis?uuid=${req.params.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.cookies.authorization}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                return res.redirect('/login');
            }
            return res.status(response.status).render('./404.ejs', {
                picture: req.session.picture,
                currentRoute: req.originalUrl,
            });
        }

        const thesis = await response.json();

        res.render('./read.ejs', {
            title: 'Read Thesis',
            pdfLink: `/read/proxy/${req.params.id}`, // Proxy endpoint for secure access to the PDF file
        });
    } catch (err) {
        console.error('Error: ', err);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/read/proxy/:id', async (req, res, next) => {
    try {
        // Fetch the metadata, which includes the URL to the PDF
        const response = await fetch(`${process.env.SERVER_API}/accessthesis?uuid=${req.params.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.cookies.authorization}`,
            },
        });

        if (!response.ok) {
            return res.status(response.status).send('Failed to fetch the thesis metadata');
        }

        // Parse the metadata JSON
        const thesisData = await response.json();

        if (!thesisData.ok || !thesisData.data) {
            return res.status(404).send('PDF URL not found');
        }

        // Extract the URL for the PDF file
        const pdfUrl = thesisData.data; // This is the URL to the actual PDF file

        // Fetch the actual PDF from the URL
        const pdfResponse = await fetch(pdfUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${req.cookies.authorization}`,
            },
        });

        if (!pdfResponse.ok) {
            return res.status(pdfResponse.status).send('Failed to fetch the PDF file');
        }

        // Convert the ReadableStream into a Node.js stream
        const pdfStream = Readable.from(pdfResponse.body);  // Create a Readable stream from the response body

        // Set the headers for PDF content and pipe the stream to the response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        pdfStream.pipe(res);  // Pipe the PDF stream directly to the response
    } catch (err) {
        console.error('Error: ', err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/keyword/:keywordId', async (req, res, next) => {
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')));
    try {
        const response = await fetch(`${process.env.SERVER_API}/keyword?uuid=${req.params.keywordId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.cookies.authorization}`
            }
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
        });

    } catch (err) {
        console.error('Error: ', err);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/author/:authorId', async (req, res, next) => {
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')));
    try {
        const response = await fetch(`${process.env.SERVER_API}/author?uuid=${req.params.authorId}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${req.cookies.authorization}`
                }
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
            author: data.data
        })
    } catch (err) {
        console.error('Error: ', err)
    }
});


module.exports = router;