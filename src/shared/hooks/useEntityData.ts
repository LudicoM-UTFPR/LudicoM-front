import { useState, useEffect, useCallback } from 'react';
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

// Hook para participantes
export function useParticipantes() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const fetched = await fetchParticipantes(controller.signal);
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
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
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

  // Força recarga de jogos do backend (ignora cache)
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

// Hook para instituições (padrão similar a eventos, sem caching avançado)
export function useInstituicoes() {
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const data = await fetchInstituicoes(controller.signal);
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
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
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