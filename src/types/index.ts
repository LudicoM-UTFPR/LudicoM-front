// Tipos globais da aplicação

export interface Emprestimo {
  id: number;
  jogo: string;
  participante: string;
  horario: string;
}

export interface RouteConfig {
  path: string;
  name: string;
  component: React.ComponentType;
}

export type RouteKey = 'HOME' | 'EVENTOS' | 'JOGOS' | 'PARTICIPANTES' | 'EMPRESTIMOS' | 'LOGIN';

export interface UIConstants {
  HEADER_HEIGHT: number;
  SCROLL_THRESHOLD: number;
  SEARCH_DEBOUNCE_DELAY: number;
}

export interface AppMessages {
  LOGIN_PLACEHOLDER: string;
  CRIAR_EVENTO: string;
  CONSULTAR_JOGO: string;
  REGISTRAR_EMPRESTIMO: string;
  CONFIRM_RETURN: string;
  SEARCH_PLACEHOLDER: string;
}

export interface SearchIconProps {
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
}

export interface ComingSoonProps {
  pageName: string;
}