const { SessionAuthentication } = require('./auth');
require('dotenv').config();
const sessAuth = new SessionAuthentication(process.env.SESSIONSECRET);

const authMiddleware = (req, res, next) => {
    if (!req || !res) {
        console.error('Invalid request or response objects');
        return;
    }

    // Allow access to public routes
    if (req.path.startsWith('/auth/login') || req.path.startsWith('/auth/setup-session') || req.path.startsWith('/warning') || req.path.startsWith('/auth/guest-session')) {
        return next();
    }

    try {
        if (!req.cookies || !req.cookies.session) {
            return res.redirect('/auth/login');
        }

        const sessionData = sessAuth.decrypt(
            JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8'))
        );

        const authCookie = sessAuth.decrypt(
            JSON.parse(Buffer.from(req.cookies.authorization, 'base64').toString('utf8'))
        );

        if (sessionData && authCookie) {
            return next();
        }

        return res.redirect('/warning');
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.redirect('/warning');
    }
};

const sessionMiddleware = (req, res, next) => {
    if (!req || !res) {
        console.error('Invalid request or response objects');
        return;
    }

    // Allow access to public routes
    if (req.path.startsWith('/auth/login') || req.path.startsWith('/auth/setup-session') || req.path.startsWith('/warning') || req.path.startsWith('/auth/guest-session')) {
        return next();
    }

    try {
        if (!req.cookies || !req.cookies.session) {
            return res.redirect('/auth/login');
        }

        const sessionData = sessAuth.decrypt(
            JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8'))
        );

        const authCookie = sessAuth.decrypt(
            JSON.parse(Buffer.from(req.cookies.authorization, 'base64').toString('utf8'))
        );

        if (sessionData && authCookie) {
            res.locals = sessionData; // Attach session data to res.locals
            return next();
        }

        return res.redirect('/auth/login');
    } catch (err) {
        console.error('Session middleware error:', err);
        return res.redirect('/warning');
    }
};

module.exports = { authMiddleware, sessionMiddleware };