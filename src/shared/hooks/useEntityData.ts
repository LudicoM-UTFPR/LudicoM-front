import { useState, useEffect, useCallback } from 'react';
import { handleError, generateId } from '../utils';
import { validateEntityData, ENTITY_SCHEMAS } from '../utils';
import { fetchJogos, createJogo, updateJogo, deleteJogo } from '../services/jogosService';
import { fetchEventos, createEvento, updateEvento, deleteEvento } from '../services/eventosService';
import type { Participante, Emprestimo, Jogo, Evento } from '../types';

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
      id: generateId('participante')
    } as Participante;
    setParticipantes(prev => [...prev, participanteComId]);
    return participanteComId;
  }, []);

  const updateParticipante = useCallback((participanteAtualizado: Participante) => {
    setParticipantes(prev => 
      prev.map(p => p.id === participanteAtualizado.id ? participanteAtualizado : p)
    );
  }, []);

  const deleteParticipante = useCallback((id: string) => {
    setParticipantes(prev => prev.filter(p => String(p.id) !== String(id)));
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
    let isMounted = true;
    const cacheKey = 'ludicom:jogos:cache';
    const TTL = 1000 * 60 * 5; // 5 minutos
    const controller = new AbortController();

    const setStateSafe = (data: Jogo[]) => {
      if (!isMounted) return;
      setJogos(data);
      setError(null);
    };

    const loadFromCache = (): { data: Jogo[]; timestamp: number } | null => {
      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.data) || typeof parsed.timestamp !== 'number') return null;
        return parsed;
      } catch {
        return null;
      }
    };

    const saveToCache = (data: Jogo[]) => {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
      } catch {
        // ignore
      }
    };

    const doFetch = async (signal?: AbortSignal, updateState = true) => {
      try {
        const fetched = await fetchJogos(signal);
        // validateEntityData is already used by service, but keep final normalization here
        const validated = validateEntityData<Jogo>(fetched as any, ENTITY_SCHEMAS.jogo as any);
        saveToCache(validated);
        if (updateState) setStateSafe(validated);
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return;
        handleError(err, 'useJogos - fetch');
        if (isMounted) setError('Erro ao carregar jogos');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    (async () => {
      try {
        // Primeiro, tenta usar cache
        const cached = loadFromCache();
        if (cached) {
          setStateSafe(cached.data);
          // Se estiver fresco, não precisa aguardar; mas sempre revalida em background se estiver stale
          const age = Date.now() - cached.timestamp;
          if (age < TTL) {
            setLoading(false);
            // Revalidação opcional em background (não atualiza estado imediatamente)
            doFetch(controller.signal, false).catch(() => {});
            return;
          }
        }

        // Sem cache ou cache stale -> busca e atualiza estado
        await doFetch(controller.signal, true);
      } catch (e) {
        handleError(e, 'useJogos - outer');
        if (isMounted) setError('Erro ao carregar jogos');
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Operações CRUD que interagem com o backend quando disponível
  async function createRemoteJogo(novo: Partial<Jogo>): Promise<Jogo> {
    try {
      const saved = await createJogo(novo);
      setJogos(prev => {
        const updated = [...prev, saved];
        try { sessionStorage.setItem('ludicom:jogos:cache', JSON.stringify({ data: updated, timestamp: Date.now() })); } catch {}
        return updated;
      });
      return saved;
    } catch (e) {
      // fallback: cria local com id gerado
      const localId = generateId('jogo');
      const localItem = { ...novo, id: localId } as Jogo;
      setJogos(prev => [...prev, localItem]);
      throw e;
    }
  }

  async function updateRemoteJogo(id: string, changes: Partial<Jogo>): Promise<Jogo> {
    try {
      const saved = await updateJogo(id, changes);
      setJogos(prev => {
        const next = prev.map(j => (String(j.id) === String(saved.id) ? saved : j));
        try {
          sessionStorage.setItem('ludicom:jogos:cache', JSON.stringify({ data: next, timestamp: Date.now() }));
        } catch {}
        return next;
      });
      return saved;
    } catch (e) {
      handleError(e, 'useJogos - updateRemoteJogo');
      throw e;
    }
  }

  async function deleteRemoteJogo(id: string): Promise<void> {
    try {
      await deleteJogo(id);
      setJogos(prev => {
        const next = prev.filter(j => String(j.id) !== String(id));
        try {
          sessionStorage.setItem('ludicom:jogos:cache', JSON.stringify({ data: next, timestamp: Date.now() }));
        } catch {}
        return next;
      });
    } catch (e) {
      handleError(e, 'useJogos - deleteRemoteJogo');
      throw e;
    }
  }

  return {
    jogos,
    loading,
    error,
    createJogo: createRemoteJogo,
    updateJogo: updateRemoteJogo,
    deleteJogo: deleteRemoteJogo
  };
}

// Hook para eventos (similar ao de jogos, porém sem caching avançado inicialmente)
export function useEventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const fetched = await fetchEventos(controller.signal);
        const validated = validateEntityData<Evento>(fetched as any, ENTITY_SCHEMAS.evento as any);
        if (isMounted) {
          setEventos(validated);
          setError(null);
        }
      } catch (e) {
        if ((e as any)?.name === 'AbortError') return;
        handleError(e, 'useEventos - fetch');
        if (isMounted) setError('Erro ao carregar eventos');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  async function createRemoteEvento(novo: Partial<Evento>): Promise<Evento> {
    try { 
      const saved = await createEvento(novo);
      setEventos(prev => [...prev, saved]);
      return saved;
    } catch (e) {
      // fallback local
      const localId = generateId('evento');
      const localItem = { ...novo, id: localId } as Evento;
      setEventos(prev => [...prev, localItem]);
      throw e;
    }
  }

  async function updateRemoteEvento(id: string, changes: Partial<Evento>): Promise<Evento> {
    try {
      const saved = await updateEvento(id, changes);
      setEventos(prev => prev.map(ev => (ev.id === saved.id ? saved : ev)));
      return saved;
    } catch (e) {
      handleError(e, 'useEventos - update');
      throw e;
    }
  }

  async function deleteRemoteEvento(id: string): Promise<void> {
    try {
      await deleteEvento(id);
      setEventos(prev => prev.filter(ev => String(ev.id) !== String(id)));
    } catch (e) {
      handleError(e, 'useEventos - delete');
      throw e;
    }
  }

  return {
    eventos,
    loading,
    error,
    createEvento: createRemoteEvento,
    updateEvento: updateRemoteEvento,
    deleteEvento: deleteRemoteEvento
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
          id: String(item.id),
          idJogo: String(item.idJogo),
          idParticipante: String(item.idParticipante),
          idEvento: String(item.idEvento),
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
      id: generateId('emprestimo')
    } as Emprestimo;
    setEmprestimosAtivos(prev => [...prev, emprestimoComId]);
    return emprestimoComId;
  }, []);

  return {
    emprestimosAtivos,
    historicoEmprestimos,
    loading,
    error,
    createEmprestimo
  };
}