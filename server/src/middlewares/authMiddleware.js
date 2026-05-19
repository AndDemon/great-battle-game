const crypto = require('crypto');
const SECRET = process.env.JWT_SECRET || 'supersecret';

module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        // Verify token format
        const parts = token.split('.');
        if (parts.length !== 3) {
            return res.status(403).json({ error: 'Invalid token format' });
        }
        const [header, payload, signature] = parts;

        // Validate signature
        const expectedSignature = crypto
            .createHmac('sha256', SECRET)
            .update(`${header}.${payload}`)
            .digest('base64url');

        if (signature !== expectedSignature) {
            return res.status(403).json({ error: 'Invalid token signature' });
        }

        // Decode payload and check expiration
        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

        if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
            return res.status(403).json({ error: 'Token expired' });
        }

        req.user = decodedPayload;
        next();
    } catch (err) {
        console.error('JWT Verification Error:', err);
        res.status(403).json({ error: 'Invalid token' });
    }
};