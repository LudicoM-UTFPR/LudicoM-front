/**
 * Padrões de validação centralizados
 * Evita duplicação de regex entre diferentes campos de formulário
 */
export const VALIDATION_PATTERNS = {
  // Validação de formato de horário HH:mm (24h)
  TIME: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  
  // Validação básica de formato de e-mail
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Validação de documento (CPF simples - apenas dígitos e pontuação)
  DOCUMENT: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  
  // Validação de RA (Registro Acadêmico - formato básico)
  RA: /^[0-9]{7,12}$/
} as const;

/**
 * Mensagens de validação centralizadas
 * Garante consistência nas mensagens de erro em toda a aplicação
 */
export const VALIDATION_MESSAGES = {
  // Mensagens gerais
  REQUIRED: 'Este campo é obrigatório',
  
  // Mensagens de nome
  NAME_MIN: 'Nome deve ter pelo menos 2 caracteres',
  NAME_MAX: 'Nome deve ter no máximo 100 caracteres',
  
  // Mensagens de e-mail
  EMAIL_INVALID: 'Formato de e-mail inválido',
  EMAIL_MIN: 'E-mail deve ter pelo menos 5 caracteres',
  EMAIL_MAX: 'E-mail deve ter no máximo 100 caracteres',
  
  // Mensagens de horário
  TIME_INVALID: 'Formato de horário inválido (HH:MM)',
  
  // Mensagens de documento
  DOCUMENT_INVALID: 'Formato de CPF inválido (000.000.000-00)',
  DOCUMENT_MIN: 'CPF deve ter pelo menos 11 caracteres',
  
  // Mensagens de RA
  RA_INVALID: 'RA deve conter apenas números',
  RA_MIN: 'RA deve ter pelo menos 7 dígitos',
  RA_MAX: 'RA deve ter no máximo 12 dígitos',
  
  // Mensagens de jogo
  GAME_NAME_MIN: 'Nome do jogo deve ter pelo menos 2 caracteres',
  GAME_NAME_MAX: 'Nome do jogo deve ter no máximo 100 caracteres',
  GAME_YEAR_MIN: 'Ano deve ser maior que 1800',
  GAME_YEAR_MAX: 'Ano não pode ser maior que o ano atual',
  GAME_TIME_MIN: 'Tempo de jogo deve ser maior que 0',
  GAME_TIME_MAX: 'Tempo de jogo deve ser menor que 1000 minutos',
  GAME_PLAYERS_MIN: 'Número mínimo de jogadores deve ser pelo menos 1',
  GAME_PLAYERS_MAX: 'Número máximo de jogadores deve ser menor que 20',
  GAME_BARCODE_MIN: 'Código de barras deve ter pelo menos 8 caracteres',
  
  // Mensagens de instituição
  INSTITUTION_MIN: 'Instituição deve ter pelo menos 2 caracteres',
  INSTITUTION_MAX: 'Instituição deve ter no máximo 100 caracteres',
  
  // Mensagens de data
  DATE_INVALID: 'Formato de data inválido'
} as const;

/**
 * Funções utilitárias de validação
 */
export const ValidationUtils = {
  /**
   * Valida um e-mail usando o padrão definido
   */
  isValidEmail: (email: string): boolean => {
    return VALIDATION_PATTERNS.EMAIL.test(email);
  },
  
  /**
   * Valida um horário usando o padrão definido
   */
  isValidTime: (time: string): boolean => {
    return VALIDATION_PATTERNS.TIME.test(time);
  },
  
  /**
   * Valida um documento (CPF) usando o padrão definido
   */
  isValidDocument: (document: string): boolean => {
    return VALIDATION_PATTERNS.DOCUMENT.test(document);
  },
  
  /**
   * Valida um RA usando o padrão definido
   */
  isValidRA: (ra: string): boolean => {
    return VALIDATION_PATTERNS.RA.test(ra);
  },
  
  /**
   * Valida se um ano está em um range aceitável
   */
  isValidYear: (year: number): boolean => {
    const currentYear = new Date().getFullYear();
    return year >= 1800 && year <= currentYear;
  }
} as const;