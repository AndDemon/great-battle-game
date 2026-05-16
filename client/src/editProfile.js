import { renderProfile } from './profile.js';

export function renderEditProfile(container, user) {
    const DEFAULT_AVATAR = 'http://localhost:3000/avatars/default.png';
    const avatarUrl = user.avatar || DEFAULT_AVATAR;

    container.innerHTML = `
        <div class="edit-profile-page">
            
            <div class="edit-profile-card">                
                <h2>Edit Profile</h2>
                <div class="avatar-block">
                    
                    <div class="section">
                        <label>Avatar</label>
                        <img 
                            src="${avatarUrl}" 
                            alt="Your Avatar" 
                            class="edit-avatar" 
                            id="profile-avatar-img"/>
                        <label class="upload-btn">
                            CHANGE AVATAR
                            <input 
                                type="file" 
                                id="avatar-upload" 
                                accept="image/png, image/jpeg" 
                                hidden />
                        </label>
                    </div>
                </div>
                
                <div class="info-block">
                    <div class="section">
                        <label>Username</label>
                        <p class="current">${user.username}</p>
                        <input 
                            type="text" 
                            id="username_input" 
                            placeholder="NEW USERNAME" />
                    </div>

                    <div class="section">
                        <label>Email</label>
                        <p class="current">${user.email}</p>
                        <input 
                            type="email" 
                            id="email_input" 
                            placeholder="NEW EMAIL" />
                    </div>

                    <div class="section">
                        <label>Password CHANGE</label>
                        <input 
                            type="password" 
                            id="current-password" 
                            placeholder="CURRENT PASSWORD" />
                        <input 
                            type="password" 
                            id="new-password" 
                            placeholder="NEW PASSWORD" />
                    </div>
                </div>
                <div class="actions">
                    <button id="back-btn">BACK</button>
                    <button id="save-btn">SAVE CHANGES</button>
                </div>
                
            </div>  
        </div>`;

    document.getElementById('back-btn').addEventListener('click', () => {
        renderProfile(container);
    });

    document.getElementById('save-btn').addEventListener('click', async () => {
        const token = localStorage.getItem('token');

        const username = document.getElementById('username_input').value;
        const email = document.getElementById('email_input').value;

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;

        if (newPassword && !currentPassword) {
            alert("Enter current password");
            return;
        }

        const body = {
            username: username || undefined,
            email: email || undefined,
            base64Image: newAvatarBase64 || undefined,
            currentPassword: currentPassword || undefined,
            password: newPassword || undefined
        };

        try {
            const res = await fetch('http://localhost:3000/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error);
                return;
            }

            localStorage.setItem('user', JSON.stringify(data.user));

            alert("Profile updated successfully!");

            renderProfile(container);

        } catch (err) {
            console.error(err);
            alert("Update failed");
        }
    });

    let newAvatarBase64 = null;
    const uploadInput = document.getElementById('avatar-upload');

    uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onloadend = () => {
            newAvatarBase64 = reader.result;
            // live preview
            document.getElementById('profile-avatar-img').src = newAvatarBase64;
        };

        reader.readAsDataURL(file);
    });
}