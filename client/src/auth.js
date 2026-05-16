let isLogin = true;
let onAuthSuccess = null;

export function renderAuth(container, renderAppCallback) {
    onAuthSuccess = renderAppCallback; 
 
    container.innerHTML = `
        <div class="auth-page">
            <div class="auth-background"></div>
            <div class="auth-content">
                <div class="auth-left">
                   <h1 class="game-title">GREAT BATTLE</h1>
                    <p class="game-subtitle">
                        Assemble your Marvel heroes and dominate the battlefield.</p> 
                </div>
                <div class="auth-card">
                    <div class="auth-logo">GREAT BATTLE</div>
                <h2>${isLogin ? 'Login to Great Battle' : 'Register New Account'}</h2>
                <form id="auth-form" class="auth-form">
                    ${isLogin 
                        ? `
                        <input 
                            type="text" 
                            id="login" 
                            placeholder="EMAIL OR USERNAME" 
                            required />` 
                        : `
                        <input 
                            type="email" 
                            id="email" 
                            placeholder="EMAIL" 
                            required />
                        <input 
                            type="text" 
                            id="username" 
                            placeholder="USERNAME" 
                            required />`
                    }                
                    <input 
                        type="password" 
                        id="password" 
                        placeholder="PASSWORD" 
                        required />
                
                    <button type="submit" class="auth-btn">
                        ${isLogin ? 'LOGIN' : 'REGISTER'}
                    </button>
                </form>
                <div class="auth-switch">
                    ${isLogin 
                        ? "Don't have an account? " 
                        : "Already have an account? "}
                    <span id="toggle-auth">
                        ${isLogin ? 'Register here' : 'Login here'}
                    </span>
                </div>
            </div>
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

    const passwordInput = document.getElementById('password').value;    
    
    const endpoint = isLogin ? '/api/login' : '/api/register';

    let payload;

    if (isLogin) {
        const loginInput = document.getElementById('login').value;
        
        payload = {
            login: loginInput,
            password: passwordInput
        };
    } else {
        const emailInput = document.getElementById('email').value;
        const usernameInput =document.getElementById('username').value;

        payload = {
            email: emailInput,
            username: usernameInput,
            password: passwordInput
        };
    }

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