const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('client-sessions');
const crypto = require('crypto');

const indexRouter = require('../routes/indexRouter.js');
const loginRouter = require('../routes/loginRouter.js');
const thesisRouter = require('../routes/thesisRouter.js');

const { authMiddleware, jwtMiddleware } = require('../public/scripts/auth');

const app = express();
const PORT = 8080;
const key1 = crypto.randomBytes(32).toString('hex');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  cookieName: 'session',
  secret: key1, 
  resave: false,
  secure: true,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 60 * 1000,
  }
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
    console.log(path.join(__dirname, '../public'))
    console.log(`Listening on port: ${PORT}`);
});
