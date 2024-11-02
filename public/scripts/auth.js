const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => { 
    if (req.path === '/login' || req.path === '/setup-session') {
        return next();
    }

    if (req.session && req.session.userId) {
        next(); 
    } else {
        console.log('Redirecting to /login');
        res.redirect('/login');
    }
};

const jwtMiddleware = (req, res, next) => {
    if (!req.cookies.authorization) {
        return res.sendStatus(401);
    }
    next();
}

module.exports = {authMiddleware, jwtMiddleware}