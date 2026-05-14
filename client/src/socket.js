import { renderBattlefield, stopBattlefieldTimer } from './battlefield.js';
import { renderProfile, setSearchingStatus } from './profile.js';

export let socket = null;
export let currentGameState = null;

export function initSocket(token, contentContainer) {
    if (socket) return; 

    socket = io('http://localhost:3000', {
        auth: { token }
    });

    socket.on('game_start', (state) => {
        currentGameState = state;
        console.log("Game Started!", state);
        setSearchingStatus(false, contentContainer);
        renderBattlefield(contentContainer, state);
    });

    socket.on('game_state_update', (state) => {
        currentGameState = state;
        renderBattlefield(contentContainer, state);
    });

    socket.on('waiting_for_opponent', () => {
        setSearchingStatus(true, contentContainer);
    });

    socket.on('player_disconnected', () => {
        const overlay = document.createElement('div');
        overlay.id = 'disconnect-overlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); color: red; display: flex; align-items: center; justify-content: center; z-index: 1000;';
        overlay.innerHTML = '<h2>Opponent disconnected. Waiting to reconnect...</h2>';
        document.body.appendChild(overlay);
    });

    socket.on('game_resumed', (data) => {
        const overlay = document.getElementById('disconnect-overlay');
        if (overlay) overlay.remove();
        currentGameState = data.state;

        renderBattlefield(contentContainer, data.state);
    });

    socket.on('game_over', (data) => {
        alert(`Game Over! Winner: ${data.winner}. Reason: ${data.reason}`);
        currentGameState = null;
        setSearchingStatus(false, contentContainer);
        stopBattlefieldTimer();
        renderProfile(contentContainer); 
    });
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
        currentGameState = null;
    }
}