let isLogin = true;
let onAuthSuccess = null;

export function renderAuth(container, renderAppCallback) {
    onAuthSuccess = renderAppCallback; 
 
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; margin-top: 100px;">
            <h2>${isLogin ? 'Login to Great Battle' : 'Register New Account'}</h2>
            
            <form id="auth-form" style="display: flex; flex-direction: column; gap: 10px; width: 300px;">
                <input type="email" id="email" placeholder="Email" required style="padding: 10px; font-size: 16px;" />
                
                ${!isLogin ? '<input type="text" id="username" placeholder="Username" required style="padding: 10px; font-size: 16px;" />' : ''}
                
                <input type="password" id="password" placeholder="Password" required style="padding: 10px; font-size: 16px;" />
                
                <button type="submit" style="padding: 10px; cursor: pointer; background-color: #e74c3c; color: white; border: none;">
                    ${isLogin ? 'Login' : 'Register'}
                </button>
            </form>

            <p style="margin-top: 20px;">
                ${isLogin ? "Don't have an account? " : "Already have an account? "}
                <span id="toggle-auth" style="color: #3498db; cursor: pointer; text-decoration: underline;">
                    ${isLogin ? 'Register here' : 'Login here'}
                </span>
            </p>
        </div>
    `;

    document.getElementById('auth-form').addEventListener('submit', handleSubmit);
    document.getElementById('toggle-auth').addEventListener('click', () => {
        isLogin = !isLogin; 
        renderAuth(container, renderAppCallback);
    });
}

async function handleSubmit(e) {
    e.preventDefault(); 
    
    const emailInput = document.getElementById('email').value;
    const passwordInput = document.getElementById('password').value;
    const usernameInput = !isLogin ? document.getElementById('username').value : undefined;
    
    const endpoint = isLogin ? '/api/login' : '/api/register';

    const payload = isLogin 
        ? { email: emailInput, password: passwordInput } 
        : { email: emailInput, username: usernameInput, password: passwordInput };

    try {
        const res = await fetch(`http://localhost:3000${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            if (onAuthSuccess) onAuthSuccess(); 
        } else {
            alert(data.error || 'An error occurred');
        }
    } catch (err) {
        console.error('Auth error:', err);
        alert('Failed to connect to the server.');
    }
}

export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onAuthSuccess) onAuthSuccess(); 
}