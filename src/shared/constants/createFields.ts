import { CreateField } from '../../components/modals/CreateModal';
import { Jogo, Participante, Evento, Emprestimo, Instituicao } from '../types';
import { VALIDATION_PATTERNS, VALIDATION_MESSAGES, ValidationUtils } from '../utils/validations';

// Configuração de campos para criar Jogos
export const jogoCreateFields: CreateField<Jogo>[] = [
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
    placeholder: 'Nome alternativo do jogo...',
    defaultValue: ''
  },
  { 
    key: 'anoPublicacao', 
    label: 'Ano de Publicação', 
    type: 'number', 
    required: true,
    defaultValue: new Date().getFullYear(),
    validation: (value: number) => {
      if (value < 1800) return VALIDATION_MESSAGES.GAME_YEAR_MIN;
      if (!ValidationUtils.isValidYear(value)) return VALIDATION_MESSAGES.GAME_YEAR_MAX;
      return null;
    }
  },
  { 
    key: 'tempoDeJogo', 
    label: 'Tempo de Jogo (minutos)', 
    type: 'number', 
    required: true,
    defaultValue: 60,
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
    defaultValue: 2,
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
    defaultValue: 4,
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
    defaultValue: '',
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
    type: 'boolean',
    defaultValue: true
  }
];

// Configuração de campos para criar Participantes
export const participanteCreateFields: CreateField<Participante>[] = [
  { 
    key: 'nome', 
    label: 'Nome Completo', 
    type: 'text', 
    required: true,
    placeholder: 'Nome completo do participante...',
    validation: (value: string) => {
      if (value.trim().length < 1) return 'Nome é obrigatório';
      if (value.length > 200) return 'Nome deve ter no máximo 200 caracteres';
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
      if (value.length > 150) return 'E-mail deve ter no máximo 150 caracteres';
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
      if (value.trim().length < 1) return 'Documento é obrigatório';
      if (value.length > 30) return 'Documento deve ter no máximo 30 caracteres';
      return null;
    }
  },
  {
    key: 'instituicao',
    label: 'Instituição (Opcional)',
    type: 'autocomplete',
    required: false,
    placeholder: 'Digite para buscar instituição...',
    dataListId: 'participante-instituicoes-list'
  },
  { 
    key: 'ra', 
    label: 'RA (Registro Acadêmico)', 
    type: 'text', 
    required: false,
    placeholder: 'RA (obrigatório se instituição informada)...',
    validation: (value: string) => {
      if (!value) return null; // será validado condicionalmente na página
      if (value.length > 15) return 'RA deve ter no máximo 15 caracteres';
      return null;
    }
  }
];

// Configuração de campos para criar Eventos
export const eventoCreateFields: CreateField<Evento>[] = [
  { 
    key: 'data', 
    label: 'Data do Evento', 
    type: 'date', 
    required: true,
    defaultValue: new Date().toISOString().split('T')[0],
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
    type: 'autocomplete', 
    required: true,
    placeholder: 'Digite para buscar instituição...',
    dataListId: 'instituicoes-list',
    validation: (value: string) => {
      if (!value || value.length < 2) return 'Selecione uma instituição';
      return null;
    }
  },
  { 
    key: 'horaInicio', 
    label: 'Horário de Início do Evento', 
    type: 'time', 
    required: true,
    defaultValue: '14:00',
    validation: (value: string) => {
      if (!value) return 'Horário de início é obrigatório';
      return null;
    }
  },
  { 
    key: 'horaFim', 
    label: 'Horário de Término do Evento', 
    type: 'time', 
    required: true,
    defaultValue: '18:00',
    validation: (value: string) => {
      if (!value) return 'Horário de término é obrigatório';
      return null;
    }
  }
];

// Configuração de campos para criar Empréstimos
export const emprestimoCreateFields: CreateField<Emprestimo>[] = [
  { 
    key: 'jogo', 
    label: 'Jogo', 
    type: 'autocomplete', 
    required: true,
    placeholder: 'Digite nome ou código de barras...',
    dataListId: 'jogos-list',
    validation: (value: string) => {
      if (!value || value.length < 2) return 'Selecione um jogo';
      return null;
    }
  },
  { 
    key: 'participante', 
    label: 'Participante', 
    type: 'autocomplete', 
    required: true,
    placeholder: 'Digite nome, documento ou RA...',
    dataListId: 'participantes-list',
    validation: (value: string) => {
      if (!value || value.length < 2) return 'Selecione um participante';
      return null;
    }
  },
  { 
    key: 'horaEmprestimo', 
    label: 'Hora do Empréstimo', 
    type: 'time', 
    required: true,
    defaultValue: () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    },
    validation: (value: string) => {
      if (!value) return 'Horário de empréstimo é obrigatório';
      return null;
    }
  },
  { 
    key: 'horaDevolucao', 
    label: 'Hora da Devolução', 
    type: 'time',
    defaultValue: () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    },
    validation: (value: string) => {
      if (!value) return null; // Campo opcional
      return null;
    }
  },
  { 
    key: 'isDevolvido', 
    label: 'Item já Devolvido', 
    type: 'boolean',
    defaultValue: false
  }
];

// Configuração de campos para criar Instituições
export const instituicaoCreateFields: CreateField<Instituicao>[] = [
  {
    key: 'nome',
    label: 'Nome da Instituição',
    type: 'text',
    required: true,
    placeholder: 'Digite o nome...',
    validation: (value: string) => {
      if (!value || value.trim().length < 1) return 'Nome é obrigatório';
      if (value.length > 200) return 'Nome deve ter no máximo 200 caracteres';
      return null;
    }
  },
  {
    key: 'endereco',
    label: 'Endereço',
    type: 'text',
    placeholder: 'Endereço (opcional)...',
    validation: (value: string) => {
      if (value && value.length > 255) return 'Endereço deve ter no máximo 255 caracteres';
      return null;
    }
  }
];