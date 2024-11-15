const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => { 
    if (req.path === '/login' || req.path === '/setup-session') {
        return next();
    }
    if (req.session.user && req.session.user.id) {
        next(); 
    } else {
        console.log('Redirecting to /login');
        res.redirect('/login');
    }
};

const jwtMiddleware = (req, res, next) => {
    if (!req.cookies.authorization) {
        res.redirect('/login');
    }
    next();
}


module.exports = {authMiddleware, jwtMiddleware}