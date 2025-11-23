// Configurações de autenticação
export const AUTH_CONFIG = {
    username: process.env.REACT_APP_AUTH_USERNAME,
    password: process.env.REACT_APP_AUTH_PASSWORD,
};

// Função para gerar o header de autenticação
export function getAuthHeaders(): HeadersInit {
    if (!AUTH_CONFIG.username || !AUTH_CONFIG.password) {
        console.error('Credenciais de autenticação não encontradas no arquivo .env');
        throw new Error('Credenciais de autenticação não configuradas');
    }
    const base64Credentials = btoa(`${AUTH_CONFIG.username}:${AUTH_CONFIG.password}`);
    const headers = {
        'Authorization': `Basic ${base64Credentials}`,
        'Content-Type': 'application/json',
    };

    return headers;
}