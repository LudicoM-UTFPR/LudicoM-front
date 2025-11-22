import type { RouteKey, UIConstants, AppMessages } from '../types';

// Constantes de navegação com tipagem forte
export const ROUTES = {
    HOME: "/",
    EVENTOS: "/eventos",
    JOGOS: "/jogos",
    PARTICIPANTES: "/participantes",
    EMPRESTIMOS: "/emprestimos",
    LOGIN: "/login",
} as const;

// Constantes de interface
export const UI_CONSTANTS: UIConstants = {
    HEADER_HEIGHT: 64,
    SCROLL_THRESHOLD: 64,
    SEARCH_DEBOUNCE_DELAY: 300,
};

// Mensagens da aplicação
export const MESSAGES: AppMessages = {
    LOGIN_PLACEHOLDER: "Funcionalidade de login será implementada",
    CRIAR_EVENTO: "Funcionalidade de Criar Evento será implementada",
    ADICIONAR_PARTICIPANTE: "Funcionalidade de Adicionar Participante será implementada",
    CONSULTAR_JOGO: "Funcionalidade de Consultar Jogo será implementada",
    REGISTRAR_EMPRESTIMO: "Funcionalidade de Registrar Empréstimo será implementada",
    CONFIRM_RETURN: "Confirmar devolução?",
    SEARCH_PLACEHOLDER: "Buscar por jogo ou participante...",
};

// URL base da API definida no arquivo .env, com fallback seguro em dev
export const API_BASE_URL: string = (process.env.REACT_APP_API_BASE_URL as string) || 'http://localhost:8080/api';

if (!process.env.REACT_APP_API_BASE_URL && process.env.NODE_ENV === 'development') {
    // Aviso apenas em desenvolvimento para facilitar configuração local
    console.warn('[Config] REACT_APP_API_BASE_URL não definido. Usando http://localhost:8080/api');
}
// Exportar configurações de campos do DetailModal
export * from './detailFields';

// Exportar configurações de campos do EditModal
export * from './editFields';

// Exportar configurações de campos do CreateModal
export * from './createFields';

// Exportar definições de colunas das tabelas
export * from './tableColumns';

// Tipos derivados das constantes
export type RouteValues = typeof ROUTES[keyof typeof ROUTES];
export type RouteKeys = keyof typeof ROUTES;