// Verificar status de autenticação e atualizar UI
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/status');
        
        if (!response.ok) {
            throw new Error('Erro ao verificar autenticação');
        }
        
        const data = await response.json();
        
        if (data.loggedIn && data.usuario) {
            // Usuário está logado
            updateUIForLoggedInUser(data.usuario);
        } else {
            // Usuário não está logado
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.log('Erro ao verificar status de autenticação:', error);
        updateUIForLoggedOutUser();
    }
}

function updateUIForLoggedInUser(usuario) {
    const loginButton = document.getElementById('loginButton');
    const loginText = document.getElementById('loginText');
    const userDropdown = document.getElementById('userDropdown');
    
    if (loginText) loginText.textContent = usuario.substring(0, 10) + (usuario.length > 10 ? '...' : '');
    if (loginButton) loginButton.classList.add('user-logged-in');
    if (userDropdown) userDropdown.style.display = 'none';
    
    // Configurar eventos do menu dropdown
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        userMenu.addEventListener('mouseenter', function() {
            if (userDropdown) userDropdown.style.display = 'block';
        });
        
        userMenu.addEventListener('mouseleave', function() {
            if (userDropdown) userDropdown.style.display = 'none';
        });
    }
}

function updateUIForLoggedOutUser() {
    const loginButton = document.getElementById('loginButton');
    
    if (loginButton) {
        loginButton.onclick = function() {
            window.location.href = '/login';
        };
        
        // Remover classe de usuário logado
        loginButton.classList.remove('user-logged-in');
        
        // Resetar texto
        const loginText = document.getElementById('loginText');
        if (loginText) loginText.textContent = 'LOGIN';
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
});