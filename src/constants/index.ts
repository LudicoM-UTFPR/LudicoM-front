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
    CONSULTAR_JOGO: "Funcionalidade de Consultar Jogo será implementada",
    REGISTRAR_EMPRESTIMO: "Funcionalidade de Registrar Empréstimo será implementada",
    CONFIRM_RETURN: "Confirmar devolução?",
    SEARCH_PLACEHOLDER: "Buscar por jogo ou participante...",
};

// Tipos derivados das constantes
export type RouteValues = typeof ROUTES[keyof typeof ROUTES];
export type RouteKeys = keyof typeof ROUTES;