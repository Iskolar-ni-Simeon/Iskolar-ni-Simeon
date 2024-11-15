const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('client-sessions');
const crypto = require('crypto');

const indexRouter = require('../routes/indexRouter.js');
const loginRouter = require('../routes/loginRouter.js');
const thesisRouter = require('../routes/thesisRouter.js');

const { authMiddleware } = require('../public/scripts/auth');

const app = express();
const PORT = 8080;
const key1 = crypto.randomBytes(32).toString('hex');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(cookieParser());

app.use("/login", loginRouter);

app.use("/", authMiddleware, indexRouter);
app.use("/",  authMiddleware, thesisRouter);

app.all('*', authMiddleware, (req, res) => {
    res.status(404).render("./404.ejs", {
        picture: req.session.picture,
        currentRoute: req.originalUrl,
    });
});

app.listen(PORT, function () {
    console.log(`Listening on port: ${PORT}`);
});
