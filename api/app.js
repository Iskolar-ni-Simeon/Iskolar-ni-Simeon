const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const favicon = require('serve-favicon');
const cors = require('cors'); 

const indexRouter = require('../routes/indexRouter.js');
const loginRouter = require('../routes/loginRouter.js');
const bffRouter = require('../routes/bff.js')
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

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.use(cookieParser());

// Improved request logging middleware with more details
app.use((req, res, next) => {
    console.log(`[APP] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | Content-Type: ${req.get('Content-Type') || 'none'}`);
    next();
});

app.get('/', (req, res) => {
    res.render("./landing.ejs")
});

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

// Update BFF router configuration as an API proxy with proper ordering
app.use("/", bffRouter); // Place BFF router first to handle API requests
console.log("[APP] BFF router configured as an API proxy with highest priority");
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
    console.log(`[APP] 404 Not Found: ${req.method} ${req.originalUrl}`);
    const decryptedSession = sessAuth.decrypt(JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8')))
    console.log("[APP] Session decrypted for 404 page");
    res.status(404).render("./404.ejs", {
        picture: decryptedSession.picture,
        currentRoute: req.originalUrl,
    });
});

app.use((err, req, res, next) => {
    console.error(`[APP] Global error handler: ${err.message}`);
    console.error(`[APP] Error stack: ${err.stack}`);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, function () {
    console.log(`[APP] Server started, listening on port: ${PORT}`);
    console.log(`[APP] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[APP] API endpoint: ${process.env.SERVER_API || 'not configured'}`);
});
//hi i am steve.

