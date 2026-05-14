const bcrypt = require('bcrypt');
const db = require('../config/db');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SECRET = process.env.JWT_SECRET || 'supersecret';

const generateToken = (payload, expiresInHours = 24) => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    
    const exp = Math.floor(Date.now() / 1000) + (expiresInHours * 3600);
    const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');

    const signature = crypto
        .createHmac('sha256', SECRET)
        .update(`${header}.${body}`)
        .digest('base64url');
        
    return `${header}.${body}.${signature}`;
};

// --- REGISTER ---
exports.register = async (req, res) => {
    const { email, username, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        // Додаємо користувача
        const [result] = await db.execute(
            'INSERT INTO Users (email, username, password_hash) VALUES (?, ?, ?)', 
            [email, username, hash]
        );

        const insertId = result.insertId;
        
        // ВИПРАВЛЕНО: Використовуємо insertId та username напряму, бо об'єкта user тут ще немає
        const token = generateToken({ id: insertId, username: username });
        
        res.status(201).json({ 
            token, 
            user: { id: insertId, username: username, avatar: null } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed (email or username might exist)' });
    }
};

// --- LOGIN  ---
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM Users WHERE email = ?', [email]);
        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken({ id: user.id, username: user.username });
        res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
};

// --- UPDATE AVATAR  ---
exports.updateAvatar = async (req, res) => {
    const { base64Image } = req.body;
    const userId = req.user.id;

    try {
        if (!base64Image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const extension = base64Image.substring("data:image/".length, base64Image.indexOf(";base64"));
        const fileName = `user_${userId}_${Date.now()}.${extension}`;

        const filePath = path.join(__dirname, '../../uploads/avatars', fileName);

        fs.writeFileSync(filePath, base64Data, 'base64');

        const avatarUrl = `http://localhost:3000/avatars/${fileName}`;
        await db.execute('UPDATE Users SET avatar = ? WHERE id = ?', [avatarUrl, userId]);

        res.json({ message: 'Avatar updated', avatarUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update avatar' });
    }
};