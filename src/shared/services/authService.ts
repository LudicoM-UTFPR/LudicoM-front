// Configurações de autenticação
export const AUTH_CONFIG = {
    username: process.env.REACT_APP_AUTH_USERNAME,
    password: process.env.REACT_APP_AUTH_PASSWORD,
};

// Função para gerar o header de autenticação
export function getAuthHeaders(): HeadersInit {
    // Fallback: se não houver credenciais, retorna apenas Content-Type e avisa no console.
    if (!AUTH_CONFIG.username || !AUTH_CONFIG.password) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('[authService] Credenciais ausentes. Usando fallback sem Authorization. Configure REACT_APP_AUTH_USERNAME e REACT_APP_AUTH_PASSWORD para habilitar autenticação.');
        }
        return {
            'Content-Type': 'application/json'
        };
    }
    const base64Credentials = btoa(`${AUTH_CONFIG.username}:${AUTH_CONFIG.password}`);
    return {
        'Authorization': `Basic ${base64Credentials}`,
        'Content-Type': 'application/json'
    };
}