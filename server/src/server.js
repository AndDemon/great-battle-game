const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const routes = require('./routes/routes');
const socketLogic = require('./sockets/gameLogic');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PUT'] }
});
const clientPath = path.join(__dirname, '../../client');
app.use(cors());
app.use(express.static(clientPath));
app.get('/', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
});
app.use(express.json({ limit: '5mb' })); 

// --- ASSET HANDLING ---
app.use('/avatars', express.static(path.join(__dirname, '../uploads/avatars')));

// REST API
app.use('/api', routes);

// Initialize WebSockets Authoritative Logic
socketLogic(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Great Battle Server running on port ${PORT}`);
});