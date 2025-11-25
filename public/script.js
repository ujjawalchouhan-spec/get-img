let currentUser = null;

async function checkAuth() {
    try {
        const response = await fetch('/auth/user', {
            credentials: 'include'
        });
        const data = await response.json();
        currentUser = data.user;
        updateUI();
    } catch (error) {
        console.error('Auth check failed:', error);
        updateUI();
    }
}

function updateUI() {
    const userInfo = document.getElementById('userInfo');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const generatorSection = document.getElementById('generatorSection');
    const loginMessage = document.getElementById('loginMessage');

    if (currentUser) {
        // User is logged in
        userInfo.innerHTML = `
            ${currentUser.picture ? `<img src="${currentUser.picture}" alt="Profile">` : ''}
            <span>${currentUser.name}</span>
        `;
        userInfo.classList.remove('hidden');
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        generatorSection.classList.remove('hidden');
        loginMessage.classList.add('hidden');
    } else {
        // User is not logged in
        userInfo.classList.add('hidden');
        loginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        generatorSection.classList.add('hidden');
        loginMessage.classList.remove('hidden');
    }
}

async function generateImage() {
    const prompt = document.getElementById('prompt').value;
    const btn = document.getElementById('generateBtn');
    const status = document.getElementById('status');
    const result = document.getElementById('result');

    if (!prompt) {
        alert('Please enter a prompt');
        return;
    }

    btn.disabled = true;
    status.textContent = 'Generating image... This may take a few seconds.';
    result.innerHTML = '';

    try {
        const response = await fetch('/api/v1/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();

        if (data.success) {
            status.textContent = `Success! Provider used: ${data.providerUsed}`;
            
            // Create image element
            const img = document.createElement('img');
            
            if (data.imageUrl) {
                img.src = data.imageUrl;
            } else if (data.imageBase64) {
                img.src = `data:image/png;base64,${data.imageBase64}`;
            }
            
            result.innerHTML = '';
            result.appendChild(img);
        } else {
            status.textContent = '';
            result.innerHTML = `<p class="error">Error: ${data.error?.message || 'Unknown error'}</p>`;
        }
    } catch (error) {
        status.textContent = '';
        result.innerHTML = `<p class="error">Network Error: ${error.message}</p>`;
    } finally {
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Check auth status on load
    checkAuth();

    // Setup event listeners
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const generateBtn = document.getElementById('generateBtn');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = '/auth/google';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.location.href = '/auth/logout';
        });
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', generateImage);
    }
});
