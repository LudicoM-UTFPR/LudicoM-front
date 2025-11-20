import { DetailField } from '../../components/modals/DetailModal';
import { Jogo, Participante, Evento, Emprestimo } from '../types';

// Configuração de campos para Jogos
export const jogoDetailFields: DetailField<Jogo>[] = [
  { key: 'id', label: 'ID', type: 'number' },
  { key: 'nome', label: 'Nome do Jogo', type: 'text' },
  { key: 'nomeAlternativo', label: 'Nome Alternativo', type: 'text' },
  { key: 'anoPublicacao', label: 'Ano de Publicação', type: 'number' },
  { 
    key: 'tempoDeJogo', 
    label: 'Tempo de Jogo', 
    type: 'custom',
    render: (value) => `${value} minutos`
  },
  { key: 'minimoJogadores', label: 'Mínimo de Jogadores', type: 'number' },
  { key: 'maximoJogadores', label: 'Máximo de Jogadores', type: 'number' },
  { key: 'codigoDeBarras', label: 'Código de Barras', type: 'text' },
  { key: 'isDisponivel', label: 'Disponível', type: 'boolean' },
  { 
    key: 'criadoQuando', 
    label: 'Criado em', 
    type: 'custom',
    render: (value) => new Date(value as string).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  },
  { 
    key: 'atualizadoQuando', 
    label: 'Atualizado em', 
    type: 'custom',
    render: (value) => new Date(value as string).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
];

// Configuração de campos para Participantes
export const participanteDetailFields: DetailField<Participante>[] = [
  { key: 'id', label: 'ID', type: 'number' },
  { key: 'nome', label: 'Nome Completo', type: 'text' },
  { key: 'email', label: 'E-mail', type: 'text' },
  { key: 'documento', label: 'Documento', type: 'text' },
  { key: 'ra', label: 'RA', type: 'text' }
];

// Configuração de campos para Eventos
export const eventoDetailFields: DetailField<Evento>[] = [
  { key: 'id', label: 'ID', type: 'number' },
  { 
    key: 'data', 
    label: 'Data do Evento', 
    type: 'custom',
    render: (value) => {
      const dateStr = value as string;
      // Se já está no formato dd/mm/yyyy, retorna diretamente
      if (dateStr && dateStr.includes('/')) {
        return dateStr;
      }
      // Caso contrário, tenta converter de ISO para dd/mm/yyyy
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      } catch {
        return dateStr || 'Data inválida';
      }
    }
  },
  { key: 'instituicao', label: 'Instituição', type: 'text' },
  { 
    key: 'horaInicio', 
    label: 'Horário de Início', 
    type: 'custom',
    render: (value) => {
      const timeStr = value as string;
      // Se já está no formato HH:mm, retorna diretamente
      if (timeStr && timeStr.includes(':') && timeStr.length <= 5) {
        return timeStr;
      }
      // Caso contrário, tenta converter de ISO para HH:mm
      try {
        const date = new Date(timeStr);
        return date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return timeStr || 'Horário inválido';
      }
    }
  },
  { 
    key: 'horaFim', 
    label: 'Horário de Término', 
    type: 'custom',
    render: (value) => {
      const timeStr = value as string;
      // Se já está no formato HH:mm, retorna diretamente
      if (timeStr && timeStr.includes(':') && timeStr.length <= 5) {
        return timeStr;
      }
      // Caso contrário, tenta converter de ISO para HH:mm
      try {
        const date = new Date(timeStr);
        return date.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return timeStr || 'Horário inválido';
      }
    }
  }
];

// Configuração de campos para Empréstimos
export const emprestimoDetailFields: DetailField<Emprestimo>[] = [
  { key: 'id', label: 'ID', type: 'number' },
  { key: 'idJogo', label: 'ID do Jogo', type: 'number' },
  { key: 'jogo', label: 'Nome do Jogo', type: 'text' },
  { key: 'idParticipante', label: 'ID do Participante', type: 'number' },
  { key: 'participante', label: 'Nome do Participante', type: 'text' },
  { key: 'idEvento', label: 'ID do Evento', type: 'number' },
  { 
    key: 'horaEmprestimo', 
    label: 'Hora do Empréstimo', 
    type: 'custom',
    render: (value) => {
      try {
        const date = new Date(value as string);
        return date.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return value as string;
      }
    }
  },
  { 
    key: 'horaDevolucao', 
    label: 'Hora da Devolução', 
    type: 'custom',
    render: (value) => {
      if (!value) return 'Não devolvido';
      try {
        const date = new Date(value as string);
        return date.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return value as string;
      }
    }
  },
  { key: 'isDevolvido', label: 'Status', type: 'custom', render: (value) => value ? 'Devolvido' : 'Emprestado' },
  { 
    key: 'horario', 
    label: 'Horário (Formatado)', 
    type: 'text'
  }
];