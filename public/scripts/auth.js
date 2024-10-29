const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    const authHeader = req.cookies['authcookie'];
    
    if (req.path === '/login' || req.path === '/setup-session') {
        return next();
    }

    if (req.session && req.session.userId) {
        next(); 
    } else {
        console.log('Redirecting to /login');
        res.redirect('/login');
    }
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1]

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401)
    }
};

module.exports = authMiddleware;
