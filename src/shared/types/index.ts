// Tipos globais da aplicação

export interface Emprestimo {
  id: number;
  idJogo: number;
  idParticipante: number;
  idEvento: number;
  horaEmprestimo: string;
  horaDevolucao: string | null;
  isDevolvido: boolean;
  // Campos computados para exibição (não persistidos)
  jogo?: string;
  participante?: string;
  horario?: string;
}

export interface Evento {
  id: number;
  data: string;
  instituicao: string;
  horarioEvento: string;
}

export interface Jogo {
  id: number;
  nome: string;
  nomeAlternativo: string;
  anoPublicacao: number;
  tempoDeJogo: number;
  minimoJogadores: number;
  maximoJogadores: number;
  codigoDeBarras: string;
  isDisponivel: boolean;
  criadoQuando: string;
  atualizadoQuando: string;
}

export interface Participante {
  id: number;
  nome: string;
  email: string;
  documento: string;
  ra: string;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface TableAction<T> {
  label: string;
  onClick: (item: T) => void;
  variant?: 'primary' | 'secondary' | 'danger';
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
  ADICIONAR_PARTICIPANTE: string;
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

export interface PageHeaderProps {
  title: string;
  buttonText?: string;
  onButtonClick?: () => void;
  showButton?: boolean;
}