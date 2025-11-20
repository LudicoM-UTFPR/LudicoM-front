import { EditField } from '../../components/modals/EditModal';
import { Jogo, Participante, Evento, Emprestimo } from '../types';
import { VALIDATION_PATTERNS, VALIDATION_MESSAGES, ValidationUtils } from '../utils/validations';

// Configuração de campos editáveis para Jogos
export const jogoEditFields: EditField<Jogo>[] = [
  { 
    key: 'nome', 
    label: 'Nome do Jogo', 
    type: 'text', 
    required: true,
    placeholder: 'Digite o nome do jogo...',
    validation: (value: string) => {
      if (value.length < 2) return VALIDATION_MESSAGES.GAME_NAME_MIN;
      if (value.length > 100) return VALIDATION_MESSAGES.GAME_NAME_MAX;
      return null;
    }
  },
  { 
    key: 'nomeAlternativo', 
    label: 'Nome Alternativo', 
    type: 'text',
    placeholder: 'Nome alternativo do jogo...'
  },
  { 
    key: 'anoPublicacao', 
    label: 'Ano de Publicação', 
    type: 'number', 
    required: true,
    validation: (value: number) => {
      const currentYear = new Date().getFullYear();
      if (value < 1800) return 'Ano deve ser maior que 1800';
      if (value > currentYear + 5) return `Ano não pode ser maior que ${currentYear + 5}`;
      return null;
    }
  },
  { 
    key: 'tempoDeJogo', 
    label: 'Tempo de Jogo (minutos)', 
    type: 'number', 
    required: true,
    validation: (value: number) => {
      if (value <= 0) return 'Tempo deve ser maior que 0';
      if (value > 1440) return 'Tempo não pode ser maior que 24 horas (1440 min)';
      return null;
    }
  },
  { 
    key: 'minimoJogadores', 
    label: 'Mínimo de Jogadores', 
    type: 'number', 
    required: true,
    validation: (value: number) => {
      if (value < 1) return 'Mínimo deve ser pelo menos 1 jogador';
      if (value > 50) return 'Mínimo não pode ser maior que 50';
      return null;
    }
  },
  { 
    key: 'maximoJogadores', 
    label: 'Máximo de Jogadores', 
    type: 'number', 
    required: true,
    validation: (value: number) => {
      if (value < 1) return 'Máximo deve ser pelo menos 1 jogador';
      if (value > 100) return 'Máximo não pode ser maior que 100';
      return null;
    }
  },
  { 
    key: 'codigoDeBarras', 
    label: 'Código de Barras', 
    type: 'text',
    placeholder: 'Código de barras do jogo...',
    validation: (value: string) => {
      if (value && value.length > 0 && value.length < 8) {
        return 'Código de barras deve ter pelo menos 8 caracteres';
      }
      return null;
    }
  },
  { 
    key: 'isDisponivel', 
    label: 'Jogo Disponível', 
    type: 'boolean'
  }
];

// Configuração de campos editáveis para Participantes
export const participanteEditFields: EditField<Participante>[] = [
  { 
    key: 'nome', 
    label: 'Nome Completo', 
    type: 'text', 
    required: true,
    placeholder: 'Nome completo do participante...',
    validation: (value: string) => {
      if (value.length < 2) return VALIDATION_MESSAGES.NAME_MIN;
      if (value.length > 100) return VALIDATION_MESSAGES.NAME_MAX;
      return null;
    }
  },
  { 
    key: 'email', 
    label: 'E-mail', 
    type: 'email', 
    required: true,
    placeholder: 'exemplo@email.com',
    validation: (value: string) => {
      if (!ValidationUtils.isValidEmail(value)) return VALIDATION_MESSAGES.EMAIL_INVALID;
      return null;
    }
  },
  { 
    key: 'documento', 
    label: 'Documento (CPF/RG)', 
    type: 'text', 
    required: true,
    placeholder: '000.000.000-00',
    validation: (value: string) => {
      if (value.length < 8) return 'Documento deve ter pelo menos 8 caracteres';
      if (value.length > 20) return 'Documento deve ter no máximo 20 caracteres';
      return null;
    }
  },
  { 
    key: 'ra', 
    label: 'RA (Registro Acadêmico)', 
    type: 'text', 
    required: true,
    placeholder: 'RA do participante...',
    validation: (value: string) => {
      if (value.length < 4) return 'RA deve ter pelo menos 4 caracteres';
      if (value.length > 20) return 'RA deve ter no máximo 20 caracteres';
      return null;
    }
  }
];

// Configuração de campos editáveis para Eventos
export const eventoEditFields: EditField<Evento>[] = [
  { 
    key: 'data', 
    label: 'Data do Evento', 
    type: 'date', 
    required: true,
    validation: (value: string) => {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) return 'Data não pode ser anterior a hoje';
      return null;
    }
  },
  { 
    key: 'instituicao', 
    label: 'Instituição', 
    type: 'text', 
    required: true,
    placeholder: 'Nome da instituição...',
    validation: (value: string) => {
      if (value.length < 2) return 'Instituição deve ter pelo menos 2 caracteres';
      if (value.length > 100) return 'Instituição deve ter no máximo 100 caracteres';
      return null;
    }
  },
  { 
    key: 'horaInicio', 
    label: 'Horário de Início do Evento', 
    type: 'text', 
    required: true,
    placeholder: '14:00',
    validation: (value: string) => {
      if (!ValidationUtils.isValidTime(value)) return VALIDATION_MESSAGES.TIME_INVALID;
      return null;
    }
  },
  { 
    key: 'horaFim', 
    label: 'Horário de Término do Evento', 
    type: 'text', 
    required: true,
    placeholder: '18:00',
    validation: (value: string) => {
      if (!ValidationUtils.isValidTime(value)) return VALIDATION_MESSAGES.TIME_INVALID;
      return null;
    }
  }
];

// Configuração de campos editáveis para Empréstimos (apenas alguns campos)
export const emprestimoEditFields: EditField<Emprestimo>[] = [
  { 
    key: 'jogo', 
    label: 'Nome do Jogo', 
    type: 'text', 
    required: true,
    placeholder: 'Nome do jogo emprestado...'
  },
  { 
    key: 'participante', 
    label: 'Nome do Participante', 
    type: 'text', 
    required: true,
    placeholder: 'Nome do participante...'
  },
  { 
    key: 'horaEmprestimo', 
    label: 'Hora do Empréstimo', 
    type: 'text', 
    placeholder: '14:30',
    validation: (value: string) => {
      if (value && !ValidationUtils.isValidTime(value)) return VALIDATION_MESSAGES.TIME_INVALID;
      return null;
    }
  },
  { 
    key: 'horaDevolucao', 
    label: 'Hora da Devolução', 
    type: 'text', 
    placeholder: '16:30',
    validation: (value: string) => {
      if (!value) return null; // Campo opcional
      if (!ValidationUtils.isValidTime(value)) return VALIDATION_MESSAGES.TIME_INVALID;
      return null;
    }
  },
  { 
    key: 'isDevolvido', 
    label: 'Item Devolvido', 
    type: 'boolean'
  }
];