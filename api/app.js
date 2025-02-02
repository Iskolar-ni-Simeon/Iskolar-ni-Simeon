const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const favicon = require('serve-favicon');
const cors = require('cors'); 

const indexRouter = require('../routes/indexRouter.js');
const loginRouter = require('../routes/loginRouter.js');
const thesisRouter = require('../routes/thesisRouter.js');

const { authMiddleware, sessionMiddleware } = require('../public/scripts/middleware');
const { SessionAuthentication } = require('../public/scripts/auth');

const app = express();
const PORT = 8080;
const sessAuth = new SessionAuthentication(process.env.SESSIONSECRET);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(favicon(path.join(__dirname, '../public/images/favicon.ico')));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/static', express.static('../static'));

// Update CORS configuration
app.use(cors({
    origin: true, // Allow all origins, or specify array of allowed domains
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.use(cookieParser());

app.get("/terms-and-conditions", (req, res) => {
    res.render("./terms.ejs");
});

app.get("/privacy-policy", (req, res) => {
    res.render("./privacy.ejs");
});

app.use(sessionMiddleware);
app.use(authMiddleware);

app.use("/auth", loginRouter);
app.use('/pdfjs', express.static(path.join(__dirname, '../web')));

app.use("/", indexRouter);
app.use("/", thesisRouter);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.get('/warning', (req, res) => {
    res.render("./warning.ejs", {
        picture: 'https://github.com/twbs/icons/blob/9ee0d1937adbb827d1c984ba38c50ac70becf8da/icons/exclamation-circle-fill.svg?raw=true',
        currentRoute: req.originalUrl
    })
})

app.all('*', authMiddleware, (req, res) => {
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')))
    res.status(404).render("./404.ejs", {
        picture: decryptedSession.picture,
        currentRoute: req.originalUrl,
    });
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, function () {
    console.log(`Listening on port: ${PORT}`);
});
//hi i am steve.

