import { socket } from './socket.js';
import { renderApp } from './main.js';
import { renderEditProfile } from './editProfile.js';

let isSearching = false;

export function renderProfile(container) {
    const userString = localStorage.getItem('user');
    
    if (!userString) {
        console.error("User data missing, forcing logout");
        localStorage.removeItem('token');
        renderApp(); 
        return;
    }

    const user = JSON.parse(userString);
    const token = localStorage.getItem('token');
    
    // Вказуємо твій локальний дефолтний аватар
    const DEFAULT_AVATAR = 'http://localhost:3000/avatars/default.png';
    const avatarUrl = user.avatar || DEFAULT_AVATAR;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.style.display = 'block';

    container.innerHTML = `
        <div class="profile-page">
            <div class="profile-panel profile-info"> 
                <h2 class="welcome-text">Welcome, ${user.username}</h2>
                <div class="avatar-wrapper">
                    <img 
                        src="${avatarUrl}" 
                        alt="Your Avatar" 
                        class="profile-avatar" 
                        id="profile-avatar-img"/>
                </div> 
                <button class="edit-btn" id="edit-profile-btn">
                    EDIT PROFILE</button>
            </div> 
            <div class="profile-panel matchmaking-panel">
                <div class="matchmaking-content">
                    <h3>Ready to fight?</h3>
                    ${!isSearching 
                        ? `<button id="find-match-btn">FIND OPPONENT</button>` 
                        : `<p class="searching-text">Searching for opponent...</p>`
                    }
                </div>  
            </div>
        </div>`;

    // Якщо картинка не провантажиться, ставимо дефолт
    document.getElementById('profile-avatar-img').onerror = function() {
        this.src = DEFAULT_AVATAR;
    };

    document.getElementById('edit-profile-btn').addEventListener('click', () => {
        renderEditProfile(container, user);
    });

    const findMatchBtn = document.getElementById('find-match-btn');
    if (findMatchBtn) {
        findMatchBtn.addEventListener('click', () => {
            if (socket) {
                socket.emit('intent_find_match');
                isSearching = true;
                renderProfile(container);
            }
        });
    }
}

export function setSearchingStatus(status, container) {
    isSearching = status;
    if (document.querySelector('.profile-page')) {
        renderProfile(container);
    }
}