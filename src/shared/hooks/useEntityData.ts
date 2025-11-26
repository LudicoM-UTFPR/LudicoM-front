import { useState, useEffect, useCallback, useRef } from 'react';
import { handleError, generateId } from '../utils';
import { validateEntityData, ENTITY_SCHEMAS } from '../utils';
import { fetchJogos, createJogo, updateJogo, deleteJogo } from '../services/jogosService';
import { fetchEventos, createEvento, updateEvento, deleteEvento } from '../services/eventosService';
import { fetchInstituicoes, createInstituicao, updateInstituicao, deleteInstituicao } from '../services/instituicaoService';
import type { Participante, Emprestimo, Jogo, Evento, Instituicao } from '../types';
import { fetchParticipantes, createParticipante, updateParticipante, deleteParticipante } from '../services/participanteService';

/**
 * Hook reutilizável para gerenciar dados de entidades específicas
 * Carrega, valida e fornece operações CRUD para diferentes tipos de dados
 */

// Flag global para evitar múltiplas requisições simultâneas durante StrictMode
const fetchingStates = new Map<string, boolean>();

// Hook para participantes
export function useParticipantes() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchKey = 'participantes';
    let isMounted = true;

    (async () => {
      // Verifica flag global para evitar requisições duplicadas
      if (fetchingStates.get(fetchKey)) return;
      fetchingStates.set(fetchKey, true);
      
      controllerRef.current = new AbortController();
      
      try {
        setLoading(true);
        const fetched = await fetchParticipantes(controllerRef.current.signal);
        const validated = validateEntityData<Participante>(fetched as any, ENTITY_SCHEMAS.participante as any);
        if (isMounted) {
          setParticipantes(validated);
          setError(null);
        }
      } catch (e) {
        if ((e as any)?.name === 'AbortError') return;
        handleError(e, 'useParticipantes - fetch');
        if (isMounted) setError('Erro ao carregar participantes');
      } finally {
        if (isMounted) setLoading(false);
        fetchingStates.delete(fetchKey);
      }
    })();

    return () => {
      isMounted = false;
      // Não aborta para permitir que a requisição complete
    };
  }, []);

  async function createRemoteParticipante(novo: Partial<Participante>): Promise<Participante> {
    // Sem fallback local: somente atualiza lista em sucesso
    const saved = await createParticipante(novo);
    setParticipantes(prev => [...prev, saved]);
    return saved;
  }

  async function updateRemoteParticipante(id: string, changes: Partial<Participante>): Promise<Participante> {
    try {
      const saved = await updateParticipante(id, changes);
      setParticipantes(prev => prev.map(p => String(p.id) === String(saved.id) ? saved : p));
      return saved;
    } catch (e) {
      handleError(e, 'useParticipantes - update');
      throw e;
    }
  }

  async function deleteRemoteParticipante(id: string): Promise<void> {
    try {
      await deleteParticipante(id);
      setParticipantes(prev => prev.filter(p => String(p.id) !== String(id)));
    } catch (e) {
      handleError(e, 'useParticipantes - delete');
      throw e;
    }
  }

  return {
    participantes,
    loading,
    error,
    createParticipante: createRemoteParticipante,
    updateParticipante: updateRemoteParticipante,
    deleteParticipante: deleteRemoteParticipante
  };
}

// Hook para jogos
export function useJogos() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let isMounted = true;
    const cacheKey = 'ludicom:jogos:cache';
    const TTL = 1000 * 60 * 5; // 5 minutos;

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
        console.error('Falha ao salvar cache de jogos no sessionStorage');
      }
    };

    const doFetch = async (signal?: AbortSignal, updateState = true) => {
      const fetchKey = 'jogos';
      if (fetchingStates.get(fetchKey)) return;
      fetchingStates.set(fetchKey, true);
      
      try {
        const fetched = await fetchJogos(signal);
        // validateEntityData is already used by service, but keep final normalization here
        const validated = validateEntityData<Jogo>(fetched as any, ENTITY_SCHEMAS.jogo as any);
        saveToCache(validated);
        if (updateState && isMounted) setStateSafe(validated);
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return;
        handleError(err, 'useJogos - fetch');
        if (isMounted) setError('Erro ao carregar jogos');
      } finally {
        if (isMounted) setLoading(false);
        fetchingStates.delete(fetchKey);
      }
    };

    (async () => {
      try {
        // Primeiro, tenta usar cache
        const cached = loadFromCache();
        if (cached) {
          const age = Date.now() - cached.timestamp;
          setStateSafe(cached.data);
          
          // Se estiver fresco, apenas exibe cache e finaliza
          if (age < TTL) {
            setLoading(false);
            return;
          }
        }

        // Sem cache ou cache stale -> busca e atualiza estado
        controllerRef.current = new AbortController();
        await doFetch(controllerRef.current.signal, true);
      } catch (e) {
        handleError(e, 'useJogos - outer');
        if (isMounted) setError('Erro ao carregar jogos');
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      // Não aborta para permitir que a requisição complete
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

  // Atualiza disponibilidade localmente (fallback quando update remoto falha ou para efeito imediato)
  function setDisponibilidadeLocal(id: string, disponivel: boolean) {
    setJogos(prev => {
      const next = prev.map(j => String(j.id) === String(id) ? { ...j, isDisponivel: disponivel } : j);
      try {
        sessionStorage.setItem('ludicom:jogos:cache', JSON.stringify({ data: next, timestamp: Date.now() }));
      } catch {}
      return next;
    });
  }

  async function refetchJogos(): Promise<void> {
    try {
      const fetched = await fetchJogos();
      const validated = validateEntityData<Jogo>(fetched as any, ENTITY_SCHEMAS.jogo as any);
      setJogos(validated);
      try {
        sessionStorage.setItem('ludicom:jogos:cache', JSON.stringify({ data: validated, timestamp: Date.now() }));
      } catch {}
    } catch (e) {
      handleError(e, 'useJogos - refetchJogos');
    }
  }

  return {
    jogos,
    loading,
    error,
    createJogo: createRemoteJogo,
    updateJogo: updateRemoteJogo,
    deleteJogo: deleteRemoteJogo,
    setDisponibilidadeLocal,
    refetchJogos
  };
}

// Hook para eventos (similar ao de jogos, porém sem caching avançado inicialmente)
export function useEventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchKey = 'eventos';
    let isMounted = true;

    (async () => {
      // Verifica flag global para evitar requisições duplicadas
      if (fetchingStates.get(fetchKey)) return;
      fetchingStates.set(fetchKey, true);
      
      controllerRef.current = new AbortController();
      
      try {
        setLoading(true);
        const fetched = await fetchEventos(controllerRef.current.signal);
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
        fetchingStates.delete(fetchKey);
      }
    })();

    return () => {
      isMounted = false;
      // Não aborta para permitir que a requisição complete
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

  // Força recarga de eventos do backend
  async function refetchEventos(): Promise<void> {
    try {
      const fetched = await fetchEventos();
      const validated = validateEntityData<Evento>(fetched as any, ENTITY_SCHEMAS.evento as any);
      setEventos(validated);
    } catch (e) {
      handleError(e, 'useEventos - refetchEventos');
    }
  }

  return {
    eventos,
    loading,
    error,
    createEvento: createRemoteEvento,
    updateEvento: updateRemoteEvento,
    deleteEvento: deleteRemoteEvento,
    refetchEventos
  };
}

// Hook para empréstimos com cache
export function useEmprestimos() {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchKey = 'emprestimos';
    let isMounted = true;
    const cacheKey = 'ludicom:emprestimos:cache';
    const TTL = 1000 * 60 * 2; // 2 minutos (cache mais curto para dados que mudam frequentemente)

    const setStateSafe = (data: Emprestimo[]) => {
      if (!isMounted) return;
      setEmprestimos(data);
      setError(null);
    };

    const loadFromCache = (): { data: Emprestimo[]; timestamp: number } | null => {
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

    const saveToCache = (data: Emprestimo[]) => {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
      } catch {
        console.error('Falha ao salvar cache de empréstimos no sessionStorage');
      }
    };

    const doFetch = async () => {
      if (fetchingStates.get(fetchKey)) return;
      fetchingStates.set(fetchKey, true);
      
      try {
        const { fetchEmprestimos } = await import('../services/emprestimosService');
        const fetched = await fetchEmprestimos();
        saveToCache(fetched);
        if (isMounted) setStateSafe(fetched);
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return;
        handleError(err, 'useEmprestimos - fetch');
        if (isMounted) setError('Erro ao carregar empréstimos');
      } finally {
        if (isMounted) setLoading(false);
        fetchingStates.delete(fetchKey);
      }
    };

    (async () => {
      try {
        // Primeiro, tenta usar cache
        const cached = loadFromCache();
        if (cached) {
          const age = Date.now() - cached.timestamp;
          setStateSafe(cached.data);
          
          // Se estiver fresco, apenas exibe cache e finaliza
          if (age < TTL) {
            setLoading(false);
            return;
          }
        }

        // Sem cache ou cache stale -> busca e atualiza estado
        await doFetch();
      } catch (e) {
        handleError(e, 'useEmprestimos - outer');
        if (isMounted) setError('Erro ao carregar empréstimos');
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      // Não aborta para permitir que a requisição complete
    };
  }, []);

  async function refetchEmprestimos(): Promise<void> {
    try {
      const { fetchEmprestimos } = await import('../services/emprestimosService');
      const fetched = await fetchEmprestimos();
      setEmprestimos(fetched);
      try {
        sessionStorage.setItem('ludicom:emprestimos:cache', JSON.stringify({ data: fetched, timestamp: Date.now() }));
      } catch {}
    } catch (e) {
      handleError(e, 'useEmprestimos - refetchEmprestimos');
    }
  }

  return {
    emprestimos,
    loading,
    error,
    refetchEmprestimos
  };
}

// Hook para instituições (padrão similar a eventos, sem caching avançado)
export function useInstituicoes() {
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchKey = 'instituicoes';
    let isMounted = true;

    (async () => {
      // Verifica flag global para evitar requisições duplicadas
      if (fetchingStates.get(fetchKey)) return;
      fetchingStates.set(fetchKey, true);
      
      controllerRef.current = new AbortController();
      
      try {
        setLoading(true);
        const data = await fetchInstituicoes(controllerRef.current.signal);
        if (isMounted) {
          setInstituicoes(data);
          setError(null);
        }
      } catch (e) {
        if ((e as any)?.name === 'AbortError') return;
        handleError(e, 'useInstituicoes - fetch');
        if (isMounted) setError('Erro ao carregar instituições');
      } finally {
        if (isMounted) setLoading(false);
        fetchingStates.delete(fetchKey);
      }
    })();

    return () => {
      isMounted = false;
      // Não aborta para permitir que a requisição complete
    };
  }, []);

  async function createRemoteInstituicao(novo: Partial<Instituicao>): Promise<Instituicao> {
    const saved = await createInstituicao(novo);
    setInstituicoes(prev => [...prev, saved]);
    return saved;
  }

  async function updateRemoteInstituicao(id: string, changes: Partial<Instituicao>): Promise<Instituicao> {
    const saved = await updateInstituicao(id, changes);
    setInstituicoes(prev => prev.map(i => i.uid === saved.uid ? saved : i));
    return saved;
  }

  async function deleteRemoteInstituicao(id: string): Promise<void> {
    await deleteInstituicao(id);
    setInstituicoes(prev => prev.filter(i => i.uid !== id));
  }

  return {
    instituicoes,
    loading,
    error,
    createInstituicao: createRemoteInstituicao,
    updateInstituicao: updateRemoteInstituicao,
    deleteInstituicao: deleteRemoteInstituicao
  };
}