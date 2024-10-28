const authMiddleware = (req, res, next) => {
    console.log(`Session userId: ${req.session ? req.session.name : 'No session'}`);
    
    // Allow access to login and setup-session without redirecting
    if (req.path === '/login' || req.path === '/setup-session') {
        return next();
    }

    // Check if user is authenticated
    if (req.session && req.session.userId) {
        next(); // User is authenticated, proceed to the requested route
    } else {
        console.log('Redirecting to /login');
        res.redirect('/login'); // User is not authenticated, redirect to login
    }
};

module.exports = authMiddleware;
