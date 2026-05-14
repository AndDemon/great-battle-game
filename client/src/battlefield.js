import { socket } from './socket.js';
import { createCardHTML } from './card.js';

let selectedAttackerId = null;
let timeLeft = 30;
let timerInterval = null;
let autoSkipTimeout = null;

function resetTimer(gameState, user) {
    if (timerInterval) clearInterval(timerInterval);
    timeLeft = 30;

    timerInterval = setInterval(() => {
        timeLeft--;
        const timerDisplay = document.getElementById('turn-timer-display');
        if (timerDisplay) {
            timerDisplay.innerText = `⏳ 00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;
            timerDisplay.style.color = timeLeft <= 5 ? '#e74c3c' : '#f1c40f';
        }

        if (timeLeft <= 0) {
            if (gameState.activePlayerId === user.id) {
                socket.emit('intent_end_turn', { roomId: gameState.id });
            }
            timeLeft = 30; 
        }
    }, 1000);
}

export function renderBattlefield(container, gameState) {
    if (!gameState) {
        container.innerHTML = '<div class="loading">Waiting for match...</div>';
        return;
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'none';

    const user = JSON.parse(localStorage.getItem('user'));
    const myId = user.id;
    const opponentId = Object.keys(gameState.players).find(id => Number(id) !== myId);
    
    const myState = gameState.players[myId];
    const opponentState = gameState.players[opponentId];
    const isMyTurn = gameState.activePlayerId === myId;

    if (autoSkipTimeout) clearTimeout(autoSkipTimeout);

    if (isMyTurn) {
        const canPlayCard = myState.hand.some(card => myState.energy >= card.cost);

        const canAttack = myState.board.some(card => !card.hasAttacked);

        if (!canPlayCard && !canAttack) {
            autoSkipTimeout = setTimeout(() => {
                socket.emit('intent_end_turn', { roomId: gameState.id });
            }, 1500);
        }
    }

    resetTimer(gameState, user);

    const DEFAULT_AVATAR = 'http://localhost:3000/avatars/default.png';

    const myAvatar = user.avatar || myState.avatar || DEFAULT_AVATAR;
    const opponentAvatar = opponentState.avatar || DEFAULT_AVATAR;

    container.innerHTML = `
        <div class="battlefield">
            <div class="zone opponent-zone">
                <div class="avatar-container" id="opponent-avatar" style="cursor: ${isMyTurn && selectedAttackerId ? 'crosshair' : 'default'};">
                    <img src="${opponentAvatar}" alt="Opponent" onerror="this.src='${DEFAULT_AVATAR}'" />
                    <div class="stats">${opponentState.username} <br/> HP: ${opponentState.hp}/20</div>
                </div>
                <div class="board" id="opponent-board">
                    ${opponentState.board.map(card => createCardHTML(card, false, false, 'board')).join('')}
                </div>
            </div>

            <div class="ui-bar">
                <div class="turn-indicator" style="color: ${isMyTurn ? '#2ecc71' : '#e74c3c'}; font-weight: bold;">
                    ${isMyTurn ? "Your Turn" : "Opponent's Turn"} 
                    <span id="turn-timer-display" style="margin-left: 15px; color: #f1c40f;">
                        ⏳ 00:30
                    </span>
                </div>
                <div style="display: flex; gap: 10px;">
                    ${isMyTurn ? `<button class="btn-surrender" id="end-turn-btn" style="background-color: #2ecc71; padding: 5px 15px;">End Turn</button>` : ''}
                    <button class="btn-surrender" id="surrender-btn" style="padding: 5px 15px;">Surrender</button>
                </div>
            </div>

            <div class="zone player-zone">
                <div class="board" id="player-board">
                    ${myState.board.map(card => createCardHTML(card, false, selectedAttackerId === card.uniqueBoardId, 'board')).join('')}
                </div>
                <div class="avatar-container" style="pointer-events: none;">
                    <img src="${myAvatar}" alt="You" onerror="this.src='${DEFAULT_AVATAR}'" />
                    <div class="stats">${myState.username} <br/> HP: ${myState.hp}/20 | EN: ${myState.energy}/${myState.maxEnergy}</div>
                </div>
            </div>

            <div class="hand" id="player-hand">
                ${myState.hand.map(card => {
                    const isPlayable = isMyTurn && myState.energy >= card.cost;
                    return createCardHTML(card, isPlayable, false, 'hand');
                }).join('')}
            </div>
        </div>
    `;

    document.getElementById('opponent-avatar').addEventListener('click', () => {
        if (isMyTurn && selectedAttackerId) {
            socket.emit('intent_attack', { roomId: gameState.id, attackerUniqueId: selectedAttackerId, targetUniqueId: 'avatar' });
            selectedAttackerId = null;
        }
    });

    document.querySelectorAll('#opponent-board .card').forEach(cardEl => {
        cardEl.addEventListener('click', () => {
            const targetId = parseFloat(cardEl.getAttribute('data-board-id'));
            if (isMyTurn && selectedAttackerId && targetId) {
                socket.emit('intent_attack', { roomId: gameState.id, attackerUniqueId: selectedAttackerId, targetUniqueId: targetId });
                selectedAttackerId = null;
            }
        });
    });

    document.querySelectorAll('#player-board .card').forEach(cardEl => {
        cardEl.addEventListener('click', () => {
            selectedAttackerId = parseFloat(cardEl.getAttribute('data-board-id'));
            renderBattlefield(container, gameState); 
        });
    });

    document.querySelectorAll('#player-hand .card.playable').forEach(cardEl => {
        cardEl.addEventListener('click', () => {
            const handId = parseFloat(cardEl.getAttribute('data-hand-id'));
            if (isMyTurn && handId) {
                socket.emit('intent_play_card', { roomId: gameState.id, cardUniqueHandId: handId });
            }
        });
    });

    const endTurnBtn = document.getElementById('end-turn-btn');
    if (endTurnBtn) {
        endTurnBtn.addEventListener('click', () => {
            if (isMyTurn) socket.emit('intent_end_turn', { roomId: gameState.id });
        });
    }

    document.getElementById('surrender-btn').addEventListener('click', () => {
        socket.emit('intent_surrender', { roomId: gameState.id });
    });
}

export function stopBattlefieldTimer() {
    if (timerInterval) clearInterval(timerInterval);
}