const express = require('express');
const router = express.Router();
const { SessionAuthentication } = require('../public/scripts/auth');
require('dotenv').config();
const sessAuth = new SessionAuthentication(process.env.SESSIONSECRET);

// More robust auth cookie extraction with fallbacks
function getAuthCookie(req) {
    try {
        // Log all cookies for debugging
        console.log(`[BFF API] Available cookies:`, Object.keys(req.cookies || {}));
        
        if (!req.cookies || !req.cookies.authorization) {
            // Try session cookie as fallback
            if (req.cookies && req.cookies.session) {
                console.log(`[BFF API] Using session cookie as fallback`);
                try {
                    const sessionData = JSON.parse(Buffer.from(req.cookies.session, 'base64').toString('utf8'));
                    console.log(`[BFF API] Session data:`, sessionData);
                    
                    if (sessionData && sessAuth.decrypt(sessionData).userId) {
                        return "Bearer " + sessAuth.decrypt(sessionData).userId; // Use userId as simple token
                    }
                } catch (e) {
                    console.error(`[BFF API] Error decrypting session:`, e);
                }
            }
            
            // For search endpoint only, use a guest token if no auth is available
            if (req.path === '/api/search') {
                console.log(`[BFF API] Using guest token for search`);
                return "Bearer guest-token";
            }
            
            console.log(`[BFF API] No authorization cookie found`);
            return null;
        }
        
        try {
            const decodedCookie = Buffer.from(req.cookies.authorization, 'base64').toString('utf8');
            const parsedCookie = JSON.parse(decodedCookie);
            const decryptedCookie = sessAuth.decrypt(parsedCookie);
            
            console.log(`[BFF API] Auth cookie decrypted successfully`);
            return decryptedCookie;
        } catch (e) {
            console.error(`[BFF API] Error processing auth cookie:`, e);
            
            // For search endpoint only, use a guest token if auth processing fails
            if (req.path === '/api/search') {
                console.log(`[BFF API] Falling back to guest token for search after auth error`);
                return "Bearer guest-token";
            }
            
            return null;
        }
    } catch (error) {
        console.error(`[BFF API] Error getting auth cookie:`, error);
        return null;
    }
}

router.get('/api/author', async (req, res) => {
    console.log(`[BFF API] Simple author proxy for ID: ${req.params.authorId}`);
    
    try {
        const authCookie = getAuthCookie(req);
        if (!authCookie) {
            return res.status(401).send('Authentication required');
        }
        
        const apiUrl = `${process.env.SERVER_API}/author?uuid=${req.query.id}`;
        console.log(`[BFF API] Fetching from: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            headers: { 'Authorization': authCookie }
        });
        
        console.log(`[BFF API] Response status: ${response.status}`);
        
        // Get text response
        const text = await response.text();
        console.log(`[BFF API] Response length: ${text.length}`);
        
        // Try to parse as JSON if appropriate
        if (response.headers.get('content-type')?.includes('application/json')) {
            try {
                const data = JSON.parse(text);
                return res.status(response.status).json(data);
            } catch (e) {
                console.error(`[BFF API] JSON parse error:`, e);
            }
        }
        
        // Default to sending text
        return res.status(response.status).send(text);
    } catch (error) {
        console.error(`[BFF API] Author proxy error:`, error);
        return res.status(500).send(`Error: ${error.message}`);
    }
});

router.get('/api/thesis', async (req, res) => {
    console.log('[BFF API]: Proxy for thesis ID:', req.query.id);

    try {
        const authCookie = getAuthCookie(req);
        
        if (!authCookie) {
            return res.json(401).send('Authentication required');
        }

        const apiUrl = `${process.env.SERVER_API}/thesis?uuid=${req.query.id}`;
        console.log(`[BFF API] Fetching from: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            headers: { 'Authorization': authCookie }
        });
        
        console.log(`[BFF API] Response status: ${response.status}`);
        
        // Get text response
        const text = await response.text();
        console.log(`[BFF API] Response length: ${text.length}`);
        
        // Try to parse as JSON if appropriate
        if (response.headers.get('content-type')?.includes('application/json')) {
            try {
                const data = JSON.parse(text);
                return res.status(response.status).json(data);
            } catch (e) {
                console.error(`[BFF API] JSON parse error:`, e);
            }
        }
        
        return res.status(response.status).send(text);
    } catch (error) {
        console.error(`[BFF API] Author proxy error:`, error);
        return res.status(500).send(`Error: ${error.message}`);
    }
});

router.get('/api/search', async (req, res) => {
    const query = req.query.q || "";
    const sort = req.query.sort || "relevance"; 
    const yearRange = req.query.yearRange;
    const yearFrom = parseInt(req.query.yearFrom) || '';
    const yearTo = parseInt(req.query.yearTo) || '';
    const type = req.query.type || '';

    try {
        const apiUrl = new URL(`${process.env.SERVER_API}/search`);
        const authCookie = getAuthCookie(req);
        apiUrl.searchParams.append('q', query);
        if (sort) apiUrl.searchParams.append('sort', sort);
        if (yearRange) apiUrl.searchParams.append('yearRange', yearRange);
        if (yearFrom) apiUrl.searchParams.append('yearFrom', yearFrom);
        if (yearTo) apiUrl.searchParams.append('yearTo', yearTo);
        if (type) apiUrl.searchParams.append('type', type);

        console.log(`[BFF API] Fetching from: ${apiUrl}`);
        const results = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authorization': authCookie
            },
            credentials: 'include',
        })
        const data = await results.json()
        console.log(data)
        res.json(data);
    } catch (error) {
        res.json({ok: false, error: error.message});
}});

router.get('/api/keyword', async (req, res) => {
    const authCookie = getAuthCookie(req);
    const keywordId = req.query.id;

    try {
        const apiUrl = `${process.env.SERVER_API}/keyword?uuid=${keywordId}`;
        console.log(`[BFF API] Fetching from: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            headers: { 'Authorization': authCookie }
        });
        
        console.log(`[BFF API] Response status: ${response.status}`);
        
        // Get text response
        const text = await response.text();
        console.log(`[BFF API] Response length: ${text.length}`);
        
        // Try to parse as JSON if appropriate
        if (response.headers.get('content-type')?.includes('application/json')) {
            try {
                const data = JSON.parse(text);
                return res.status(response.status).json(data);
            } catch (e) {
                console.error(`[BFF API] JSON parse error:`, e);
            }
        }
        
        return res.status(response.status).send(text);
    } catch (error) {
        res.status(500).json({ok: false, error: error.message});
    }
});

// Add health check endpoint with detailed information
router.get('/api/health', (req, res) => {
    console.log(`[BFF API] Health check called`);
    
    const serverAPI = process.env.SERVER_API || 'Not configured';
    
    res.status(200).json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: {
            serverAPI: serverAPI.replace(/\/\/.*@/, '//[redacted]@'), // Redact auth info if present in URL
            nodeEnv: process.env.NODE_ENV || 'development'
        }
    });
});

router.get('/api/saved', async (req, res) => {
    console.log('[BFF API]: Fetching saved theses');
    
    try {
        const authCookie = getAuthCookie(req);
        
        if (!authCookie) {
            console.log('[BFF API]: No auth cookie found for saved theses request');
            return res.status(401).json({
                ok: false,
                message: 'Authentication required',
                errmessage: 'Please login to view your saved theses.'
            });
        }
        
        // Get user ID from local variables or query parameter
        const userId = req.query.userId || res.locals.userId;
        
        if (!userId) {
            console.log('[BFF API]: No user ID provided for saved theses');
            return res.status(400).json({
                ok: false,
                message: 'Bad Request',
                errmessage: 'User ID is required to fetch saved theses.'
            });
        }
        
        console.log(`[BFF API]: Fetching saved theses for user: ${userId}`);
        const apiUrl = `${process.env.SERVER_API}/userlibrary?id=${userId}`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authCookie
            }
        });
        
        console.log(`[BFF API]: Saved theses response status: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[BFF API]: Error fetching saved theses: ${errorText}`);
            return res.status(response.status).json({
                ok: false,
                message: 'Failed to fetch saved theses',
                errmessage: 'Could not retrieve your saved theses. Please try again later.'
            });
        }
        
        const data = await response.json();
        console.log(`[BFF API]: Successfully fetched ${data.data ? data.data.length : 0} saved theses`);
        
        return res.json(data);
    } catch (error) {
        console.error(`[BFF API]: Error in saved theses fetch:`, error);
        return res.status(500).json({
            ok: false,
            message: 'Internal Server Error',
            errmessage: 'An unexpected error occurred while retrieving your saved theses.'
        });
    }
});

module.exports = router;