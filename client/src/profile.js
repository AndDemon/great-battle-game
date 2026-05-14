import { socket } from './socket.js';
import { renderApp } from './main.js';

let isSearching = false;
let isUploading = false;

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
        <div class="profile-container"> 
            <h2>Welcome, ${user.username}</h2>
            
            <div class="avatar-section">
                <img src="${avatarUrl}" alt="Your Avatar" class="profile-avatar" id="profile-avatar-img" />
                <label class="upload-btn" style="background-color: ${isUploading ? '#7f8c8d' : '#3498db'}; cursor: ${isUploading ? 'not-allowed' : 'pointer'}">
                    ${isUploading ? 'Uploading...' : 'Change Avatar'}
                    <input type="file" id="avatar-upload" accept="image/png, image/jpeg" style="display: none;" ${isUploading ? 'disabled' : ''} />
                </label>
            </div>

            <div class="matchmaking-section">
                <h3>Ready to fight?</h3>
                ${!isSearching 
                    ? `<button id="find-match-btn" class="upload-btn" style="background-color: #e74c3c; font-size: 18px;">Find Match</button>` 
                    : `<p>Searching for opponent...</p>`
                }
            </div>
        </div>
    `;

    // Якщо картинка не провантажиться, ставимо дефолт
    document.getElementById('profile-avatar-img').onerror = function() {
        this.src = DEFAULT_AVATAR;
    };

    const uploadInput = document.getElementById('avatar-upload');
    if (uploadInput) {
        uploadInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = async () => {
                isUploading = true;
                renderProfile(container);

                try {
                    const response = await fetch('http://localhost:3000/api/avatar', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ base64Image: reader.result })
                    });
                    if (response.ok) {
                        const data = await response.json();
                        user.avatar = data.avatarUrl;
                        localStorage.setItem('user', JSON.stringify(user));
                        alert('Avatar updated successfully!');
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    isUploading = false;
                    renderProfile(container);
                }
            };
        });
    }

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
    if (document.querySelector('.profile-container')) {
        renderProfile(container);
    }
}