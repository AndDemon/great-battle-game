const crypto = require('crypto');
const db = require('../config/db');
const SECRET = process.env.JWT_SECRET || 'supersecret';

const rooms = {}; 
const disconnectTimers = {};
let waitingPlayer = null;

module.exports = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error: No token'));

        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return next(new Error('Authentication error: Invalid format'));
            }
            const [header, payload, signature] = parts;

            const expectedSignature = crypto
                .createHmac('sha256', SECRET)
                .update(`${header}.${payload}`)
                .digest('base64url');

            if (signature !== expectedSignature) {
                return next(new Error('Authentication error: Invalid signature'));
            }

            const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

            if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
                return next(new Error('Authentication error: Token expired'));
            }

            socket.user = decodedPayload;
            next();
        } catch (err) {
            console.error('Socket JWT Error:', err);
            return next(new Error('Authentication error: Verification failed'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user.id;

        // 1. Reconnect Logic
        const existingRoom = Object.values(rooms).find(r => r.players[userId]);
        if (existingRoom) {
            socket.join(existingRoom.id);
            existingRoom.players[userId].socketId = socket.id;
            
            if (disconnectTimers[userId]) {
                clearTimeout(disconnectTimers[userId]);
                delete disconnectTimers[userId];
                existingRoom.status = 'playing';
                io.to(existingRoom.id).emit('game_resumed', { state: existingRoom });
            }
            return;
        }

        // 2. (Matchmaking Intent)
        socket.on('intent_find_match', async () => {
            if (waitingPlayer && waitingPlayer.user.id !== userId) {
                const roomId = `room_${Date.now()}`;
                socket.join(roomId);
                waitingPlayer.join(roomId);
                
                try {
                    const [cards] = await db.execute('SELECT * FROM Cards');
                    const getHandWithStacking = () => {
                        let hand = [];
                        while (hand.length < 4) {
                            const dbCard = cards[Math.floor(Math.random() * cards.length)];
                            const existingCard = hand.find(c => c.name === dbCard.name && c.stackCount < 2);
                            
                            if (existingCard) {
                                existingCard.stackCount += 1;
                                existingCard.attack = dbCard.attack * existingCard.stackCount;
                                existingCard.defense = dbCard.defense * existingCard.stackCount;
                            } else {
                                hand.push({ 
                                    ...dbCard, 
                                    uniqueHandId: Date.now() + Math.random(),
                                    stackCount: 1 
                                });
                            }
                        }
                        return hand;
                    };

                    const [p1Row] = await db.execute('SELECT avatar FROM Users WHERE id = ?', [waitingPlayer.user.id]);
                    const [p2Row] = await db.execute('SELECT avatar FROM Users WHERE id = ?', [userId]);

                    rooms[roomId] = {
                        id: roomId,
                        status: 'playing',
                        turnTimer: null,
                        activePlayerId: Math.random() > 0.5 ? waitingPlayer.user.id : userId,
                        players: {
                            [waitingPlayer.user.id]: { 
                                hp: 20, energy: 2, maxEnergy: 2, 
                                hand: getHandWithStacking(), board: [], 
                                socketId: waitingPlayer.id,
                                avatar: p1Row[0]?.avatar,
                                username: waitingPlayer.user.username
                            },
                            [userId]: { 
                                hp: 20, energy: 2, maxEnergy: 2, 
                                hand: getHandWithStacking(), board: [], 
                                socketId: socket.id,
                                avatar: p2Row[0]?.avatar,
                                username: socket.user.username
                            }
                        }
                    };
                    
                    io.to(roomId).emit('game_start', rooms[roomId]);
                    waitingPlayer = null;
                } catch (err) {
                    console.error("Matchmaking error:", err);
                }
            } else {
                waitingPlayer = socket;
                socket.emit('waiting_for_opponent'); 
            }
        });

socket.on('intent_play_card', ({ roomId, cardUniqueHandId }) => {
            const room = rooms[roomId];
            if (!room || room.activePlayerId !== userId) return;

            const player = room.players[userId];
            const cardIndex = player.hand.findIndex(c => c.uniqueHandId === cardUniqueHandId);
            
            if (cardIndex === -1) return;
            
            const card = player.hand[cardIndex];
            if (player.energy < card.cost) return;
            const existingBoardCard = player.board.find(c => c.name === card.name);
            if (!existingBoardCard && player.board.length >= 6) return;
            player.energy -= card.cost;
            
            player.hand.splice(cardIndex, 1);
            if (existingBoardCard) {
                existingBoardCard.stackCount = (existingBoardCard.stackCount || 1) + (card.stackCount || 1);

                existingBoardCard.attack += card.attack;
                existingBoardCard.defense += card.defense;
            } else {

                player.board.push({ 
                    ...card, 
                    uniqueBoardId: Date.now(),
                    stackCount: card.stackCount || 1 
                });
            }

            io.to(roomId).emit('game_state_update', room);
        });

        // 4. Attack Intent
        socket.on('intent_attack', ({ roomId, attackerUniqueId, targetUniqueId }) => {
            const room = rooms[roomId];
            if (!room || room.activePlayerId !== userId) return;

            const attackerState = room.players[userId];
            const opponentId = Object.keys(room.players).find(id => id != userId);
            const opponentState = room.players[opponentId];

            const attackerCard = attackerState.board.find(c => c.uniqueBoardId === attackerUniqueId);
            if (!attackerCard || attackerCard.hasAttacked) return;

            if (targetUniqueId === 'avatar' && opponentState.board.length > 0) {
                return socket.emit('error', 'Must attack active cards first');
            }

            if (targetUniqueId === 'avatar') {
                opponentState.hp -= attackerCard.attack;
                if (opponentState.hp <= 0) {
                    io.to(roomId).emit('game_over', { winner: userId, reason: 'hp_zero' });
                    delete rooms[roomId];
                    return;
                }
            } else {
                const targetCard = opponentState.board.find(c => c.uniqueBoardId === targetUniqueId);
                if (!targetCard) return;

                targetCard.defense -= attackerCard.attack;
                attackerCard.defense -= targetCard.attack;

                if (targetCard.defense <= 0) opponentState.board = opponentState.board.filter(c => c.uniqueBoardId !== targetUniqueId);
                if (attackerCard.defense <= 0) attackerState.board = attackerState.board.filter(c => c.uniqueBoardId !== attackerUniqueId);
            }

            attackerCard.hasAttacked = true;
            io.to(roomId).emit('game_state_update', room);
        });

        // 4.5 End Turn Intent 
        socket.on('intent_end_turn', async ({ roomId }) => {
            const room = rooms[roomId];
            if (!room || room.activePlayerId !== userId) return;
            try {
                const [cards] = await db.execute('SELECT * FROM Cards');
                const currentPlayer = room.players[userId];

                while (currentPlayer.hand.length < 4) {
                    const dbCard = cards[Math.floor(Math.random() * cards.length)];
                    const existingCard = currentPlayer.hand.find(c => c.name === dbCard.name);
                    
                    if (existingCard) {
                        existingCard.stackCount += 1;
                        existingCard.attack = dbCard.attack * existingCard.stackCount;
                        existingCard.defense = dbCard.defense * existingCard.stackCount;
                    } else {
                        currentPlayer.hand.push({ 
                            ...dbCard, 
                            uniqueHandId: Date.now() + Math.random(),
                            stackCount: 1 
                        });
                    }
                }
            } catch (err) {
                console.error("Error drawing cards:", err);
            }
            
            const opponentId = Object.keys(room.players).find(id => id != userId);
            room.activePlayerId = Number(opponentId);
            room.turnStartTime = Date.now(); 

            const newActivePlayer = room.players[opponentId];
            if (newActivePlayer.maxEnergy < 10) newActivePlayer.maxEnergy += 1;
            newActivePlayer.energy = newActivePlayer.maxEnergy;

            newActivePlayer.board.forEach(card => card.hasAttacked = false);

            io.to(roomId).emit('game_state_update', room);
        });


        // 5. Surrender Intent
        socket.on('intent_surrender', ({ roomId }) => {
            const room = rooms[roomId];
            if (!room) return;
            const opponentId = Object.keys(room.players).find(id => id != userId);
            io.to(roomId).emit('game_over', { winner: opponentId, reason: 'surrender' });
            delete rooms[roomId];
        });

        // 6. Disconnect
        socket.on('disconnect', () => {
            if (waitingPlayer && waitingPlayer.id === socket.id) {
                waitingPlayer = null;
                return;
            }

            const activeRoom = Object.values(rooms).find(r => r.players[userId]);
            if (activeRoom) {
                activeRoom.status = 'paused';
                io.to(activeRoom.id).emit('player_disconnected', { userId });
                
                disconnectTimers[userId] = setTimeout(() => {
                    const opponentId = Object.keys(activeRoom.players).find(id => id != userId);
                    io.to(activeRoom.id).emit('game_over', { winner: opponentId, reason: 'abandonment' });
                    delete rooms[activeRoom.id];
                    delete disconnectTimers[userId];
                }, 30000);
            }
        });
    });
};