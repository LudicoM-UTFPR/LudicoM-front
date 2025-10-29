import { useState, useEffect, useCallback } from 'react';
import { handleError, validateEntityData, ENTITY_SCHEMAS } from '../utils';
import type { Participante, Emprestimo, Jogo } from '../types';

/**
 * Hook reutilizável para gerenciar dados de entidades específicas
 * Carrega, valida e fornece operações CRUD para diferentes tipos de dados
 */

// Hook para participantes
export function useParticipantes() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadParticipantes = async () => {
      try {
        setLoading(true);
        // Import dinâmico para evitar carregamento desnecessário
        const participantesData = await import('../data/participantes.json');
        const validatedData = validateEntityData<Participante>(participantesData.default, ENTITY_SCHEMAS.participante);
        setParticipantes(validatedData);
        setError(null);
      } catch (error) {
        const errorMessage = 'Erro ao carregar participantes';
        handleError(error, "useParticipantes - Data Loading");
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadParticipantes();
  }, []);

  const createParticipante = useCallback((novoParticipante: Omit<Participante, 'id'>) => {
    const participanteComId = {
      ...novoParticipante,
      id: Math.max(...participantes.map(p => p.id), 0) + 1
    };
    setParticipantes(prev => [...prev, participanteComId]);
    return participanteComId;
  }, [participantes]);

  const updateParticipante = useCallback((participanteAtualizado: Participante) => {
    setParticipantes(prev => 
      prev.map(p => p.id === participanteAtualizado.id ? participanteAtualizado : p)
    );
  }, []);

  const deleteParticipante = useCallback((id: number) => {
    setParticipantes(prev => prev.filter(p => p.id !== id));
  }, []);

  return {
    participantes,
    loading,
    error,
    createParticipante,
    updateParticipante,
    deleteParticipante
  };
}

// Hook para jogos
export function useJogos() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJogos = async () => {
      try {
        setLoading(true);
        const jogosData = await import('../data/jogos.json');
        const validatedData = validateEntityData<Jogo>(jogosData.default, ENTITY_SCHEMAS.jogo);
        setJogos(validatedData);
        setError(null);
      } catch (error) {
        const errorMessage = 'Erro ao carregar jogos';
        handleError(error, "useJogos - Data Loading");
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadJogos();
  }, []);

  return {
    jogos,
    loading,
    error
  };
}

// Hook para empréstimos
export function useEmprestimos() {
  const [emprestimosAtivos, setEmprestimosAtivos] = useState<Emprestimo[]>([]);
  const [historicoEmprestimos, setHistoricoEmprestimos] = useState<Emprestimo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEmprestimos = async () => {
      try {
        setLoading(true);
        const emprestimosData = await import('../data/emprestimos.json');
        
        // Validação e processamento dos dados (similar ao código da página Emprestimos)
        const allValidatedData = emprestimosData.default.map((item): Emprestimo => ({
          id: Number(item.id),
          idJogo: Number(item.idJogo),
          idParticipante: Number(item.idParticipante),
          idEvento: Number(item.idEvento),
          horaEmprestimo: String(item.horaEmprestimo || ''),
          horaDevolucao: item.horaDevolucao ? String(item.horaDevolucao) : null,
          isDevolvido: Boolean(item.isDevolvido),
          jogo: String(item.jogo || ""),
          participante: String(item.participante || ""),
          horario: String(item.horario || "")
        }));

        const ativos = allValidatedData.filter(item => !item.isDevolvido);
        const historico = allValidatedData.filter(item => item.isDevolvido);

        setEmprestimosAtivos(ativos);
        setHistoricoEmprestimos(historico);
        setError(null);
      } catch (error) {
        const errorMessage = 'Erro ao carregar empréstimos';
        handleError(error, "useEmprestimos - Data Loading");
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadEmprestimos();
  }, []);

  const createEmprestimo = useCallback((novoEmprestimo: Omit<Emprestimo, 'id'>) => {
    const emprestimoComId = {
      ...novoEmprestimo,
      id: Math.max(...emprestimosAtivos.map(e => e.id), ...historicoEmprestimos.map(e => e.id), 0) + 1
    };
    setEmprestimosAtivos(prev => [...prev, emprestimoComId]);
    return emprestimoComId;
  }, [emprestimosAtivos, historicoEmprestimos]);

  return {
    emprestimosAtivos,
    historicoEmprestimos,
    loading,
    error,
    createEmprestimo
  };
}