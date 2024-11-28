const express = require('express');
const { SessionAuthentication } = require('../public/scripts/auth');
const multer = require('multer');
const router = express.Router();
require('dotenv').config()

const sessAuth = new SessionAuthentication(process.env.SESSIONSECRET);
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.get('/', async (req, res, next) => {
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')));
    res.render('addthesis.ejs', {
        currentRoute: req.originalUrl,
        picture: decryptedSession.picture,
    })
})
router.post('/', upload.single('file'), async (req, res, next) => {
    const authCookie = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.authorization, 'base64').toString('utf8')));

    const thesisData = req.body;
    const file = req.file.buffer;

    const response = await fetch(`${process.env.SERVER_API}/addthesis`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authCookie}`
        },
        body: JSON.stringify({
            thesisData,
            file
        })
    }).then(res => {
        if (!res.ok) {
            throw new Error('Error adding thesis');
        }
        return res.json();
    }).then(data => {
        res.redirect(`/thesis/${data.id}`);
    })
})

module.exports = router;