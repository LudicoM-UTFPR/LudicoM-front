import React from 'react';
import type { TableColumn, Jogo, Participante, Evento, Emprestimo, Instituicao } from '../types';

/**
 * Definições centralizadas de colunas para tabelas
 * Elimina duplicação entre páginas e componentes
 */

// Colunas para Jogos (usado em Jogos.tsx e ConsultModal.tsx)
export const JOGO_COLUMNS: TableColumn<Jogo>[] = [
  { key: 'nome', label: 'Nome' },
  { key: 'nomeAlternativo', label: 'Nome Alternativo' },
  { 
    key: 'minimoJogadores', 
    label: 'Jogadores',
    render: (value: number, item: Jogo) => `${item.minimoJogadores} ~ ${item.maximoJogadores}`
  },
  { 
    key: 'tempoDeJogo', 
    label: 'Duração',
    render: (value: number) => `${value} min`
  },
  { 
    key: 'isDisponivel', 
    label: 'Status',
    render: (value: boolean) => (
      <span className={`status-jogo ${value ? 'disponivel' : 'indisponivel'}`}>
        {value ? 'Disponível' : 'Indisponível'}
      </span>
    )
  }
];

// Colunas para Participantes
export const PARTICIPANTE_COLUMNS: TableColumn<Participante>[] = [
  { key: 'nome', label: 'Nome' },
  { key: 'documento', label: 'CPF' },
  { key: 'ra', label: 'RA' },
  { key: 'email', label: 'E-mail' }
];

// Colunas para Eventos
export const EVENTO_COLUMNS: TableColumn<Evento>[] = [
  { key: 'data', label: 'Data' },
  {
    key: 'instituicao',
    label: 'Instituição',
    render: (value: Instituicao, item: Evento) => (
      <span>
        {value.nome}
      </span>
    )
  },
  { 
    key: 'horaInicio', 
    label: 'Horário',
    render: (value: string, item: Evento) => {
      return `${value} - ${item.horaFim}`;
    }
  }
];

// Colunas para Empréstimos - Lista geral
export const EMPRESTIMO_COLUMNS: TableColumn<Emprestimo>[] = [
  { key: 'jogo', label: 'Jogo' },
  { key: 'participante', label: 'Participante' },
  { key: 'horario', label: 'Horário Empréstimo' }
];

// Colunas para Empréstimos - Modal de detalhes
export const EMPRESTIMO_DETAIL_COLUMNS: TableColumn<Emprestimo>[] = [
  { key: 'jogo', label: 'Jogo' },
  { key: 'participante', label: 'Participante' },
  { key: 'horario', label: 'Horário Empréstimo' },
  {
    key: 'horaDevolucao',
    label: 'Horário Devolução',
    render: (value: string | null) => value ? String(value) : 'N/A'
  }
];