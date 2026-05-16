const bcrypt = require('bcrypt');
const db = require('../config/db');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { error } = require('console');

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
            user: { id: insertId, username: username, email: email, avatar: null } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed (email or username might exist)' });
    }
};

// --- LOGIN  ---
exports.login = async (req, res) => {
    const { login, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM Users WHERE email = ? OR username = ?', [login, login]);
        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken({ id: user.id, username: user.username });
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
};

// --- UPDATE PROFILE  ---
exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { username, email, currentPassword, password, base64Image } = req.body;

    try {
        const updates = [];
        const values = [];

        if (username && username.trim() !== ""){
            const [existingUsername] = await db.execute(
                "SELECT id FROM Users WHERE username = ? AND id != ?",
                [username, userId]
            );

            if (existingUsername.length > 0) {
                return res.status(409).json({ error: "Username already taken" });
            }

            updates.push("username = ?");
            values.push(username);
        }

        if (email && email.trim() !== ""){
            const [existingEmail] = await db.execute(
                "SELECT id FROM Users WHERE email = ? AND id != ?",
                [email, userId]
            );

            if (existingEmail.length > 0) {
                return res.status(409).json({ error: "Email already in use" });
            }
            
            updates.push("email = ?");
            values.push(email);
        }

        if (password && password.trim() !== ""){
            if (!currentPassword) {
                return res.status(400).json({
                    error: "Current password is required"
                });
            }

            const [rows] = await db.execute(
                "SELECT password_hash FROM Users WHERE id = ?",
                [userId]
            );

            const user = rows[0];

            const isMatch = await bcrypt.compare(
                currentPassword,
                user.password_hash
            );

            if (!isMatch) {
                return res.status(401).json({
                    error: "Current password is incorrect"
                });
            }

            const newHash = await bcrypt.hash(password, 10);

            updates.push("password_hash = ?");
            values.push(newHash);
        }

        if (base64Image) {
            const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
            const extension = base64Image.substring(
                "data:image/".length,
                base64Image.indexOf(";base64")
            );

            const fileName = `user_${userId}_${Date.now()}.${extension}`;
            const filePath = path.join(
                __dirname,
                '../../uploads/avatars',
                fileName
            );

            fs.writeFileSync(filePath, base64Data, 'base64');

            const avatarUrl = `http://localhost:3000/avatars/${fileName}`;

            updates.push("avatar = ?");
            values.push(avatarUrl);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                error: "Nothing to update"
            });
        }

        values.push(userId);

        await db.execute(
            `UPDATE Users SET ${updates.join(", ")} WHERE id = ?`,
            values
        );

        const [rows] = await db.execute(
            "SELECT id, username, email, avatar FROM Users WHERE id = ?",
            [userId]
        );

        res.json({ user: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Profile update failed' });
    }
};