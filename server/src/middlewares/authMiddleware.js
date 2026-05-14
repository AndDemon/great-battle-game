const crypto = require('crypto');
const SECRET = process.env.JWT_SECRET || 'supersecret';

module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        // 1. Розбиваємо токен на 3 частини
        const parts = token.split('.');
        if (parts.length !== 3) {
            return res.status(403).json({ error: 'Invalid token format' });
        }
        const [header, payload, signature] = parts;

        // 2. Генеруємо очікуваний підпис за допомогою нативного модуля crypto
        const expectedSignature = crypto
            .createHmac('sha256', SECRET)
            .update(`${header}.${payload}`)
            .digest('base64url');

        // 3. Перевіряємо, чи збігається підпис (захист від підробки)
        if (signature !== expectedSignature) {
            return res.status(403).json({ error: 'Invalid token signature' });
        }

        // 4. Декодуємо корисне навантаження (payload)
        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

        // 5. Перевіряємо термін дії токена (якщо він є)
        if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
            return res.status(403).json({ error: 'Token expired' });
        }

        // Передаємо дані користувача далі
        req.user = decodedPayload;
        next();
    } catch (err) {
        console.error('JWT Verification Error:', err);
        res.status(403).json({ error: 'Invalid token' });
    }
};