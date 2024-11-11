const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const crypto = require('crypto');

const indexRouter = require('./routes/indexRouter.js');
const loginRouter = require('./routes/loginRouter.js');
const thesisRouter = require('./routes/thesisRouter.js');

const { authMiddleware, jwtMiddleware } = require('./public/scripts/auth');

const app = express();
const PORT = 8080;
const key1 = crypto.randomBytes(32).toString('hex');
const key2 = crypto.randomBytes(32).toString('hex');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cookieParser());

// Set secure to false for local development
app.use(cookieSession({
    name: 'session',
    keys: [key1, key2], // Use your own secure keys in production
    maxAge: 60 * 60 * 1000, // 1 hour
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    httpOnly: true,
}));

// Public route, no auth required
app.use("/login", loginRouter);

// Protected routes, auth required
app.use("/", authMiddleware, jwtMiddleware, indexRouter);
app.use("/", authMiddleware, jwtMiddleware, thesisRouter);

// Catch-all for 404 errors
app.all('*', (req, res) => {
    res.status(404).render("./404.ejs", {
        picture: req.session?.picture,
        currentRoute: req.originalUrl,
    });
});

// Start the server
app.listen(PORT, function () {
    console.log(`Listening on port: ${PORT}`);
});
