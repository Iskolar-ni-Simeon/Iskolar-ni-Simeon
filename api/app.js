const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const crypto = require('crypto');

const indexRouter = require('../routes/indexRouter.js');
const loginRouter = require('../routes/loginRouter.js');
const thesisRouter = require('../routes/thesisRouter.js');

const { authMiddleware, jwtMiddleware } = require('../public/scripts/auth.js');

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

app.use(cookieSession({
    name: 'session',
    keys: [key1, key2], 
    maxAge: 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    httpOnly: true,
}));

app.use("/login", loginRouter);

app.use("/", authMiddleware, jwtMiddleware, indexRouter);
app.use("/",  authMiddleware, jwtMiddleware, thesisRouter);

app.all('*', authMiddleware, jwtMiddleware, (req, res) => {
    res.status(404).render("./404.ejs", {
        picture: req.session?.picture,
        currentRoute: req.originalUrl,
    });
});

app.listen(PORT, function () {
    console.log(`Listening on port: ${PORT}`);
});
