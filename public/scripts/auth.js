const authMiddleware = (req, res, next) => {
    console.log(`Session userId: ${req.session ? req.session.name : 'No session'}`);
    
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

module.exports = authMiddleware;
