// src/main.js
import { renderAuth } from './auth.js';
import { renderProfile } from './profile.js';
import { initSocket, disconnectSocket } from './socket.js';

export function renderApp() {
    const token = localStorage.getItem('token');
    const appContainer = document.getElementById('app');

    if (!token) {
        disconnectSocket();
        renderAuth(appContainer, renderApp);
    } else {
        appContainer.innerHTML = `
            <div class="app-container">
                <header class="app-header" style="padding: 10px; background-color: #111; color: white; display: flex; justify-content: space-between;">
                    <h2 style="margin: 0;">Great Battle</h2>
                    <button id="logout-btn" style="padding: 5px 15px; cursor: pointer;">Logout</button>
                </header>
                <div id="game-content"></div> 
            </div>
        `;

        const contentContainer = document.getElementById('game-content');

        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            renderApp();
        });

        initSocket(token, contentContainer);
        
        renderProfile(contentContainer);
    }
}

renderApp();