import { useState, useEffect } from 'react';
import type { Instituicao } from '../types';
import { fetchInstituicoes } from '../services/instituicaoService';
import { handleError } from '../utils';

export function useInstituicoes() {
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    
    const loadInstituicoes = async () => {
      try {
        setLoading(true);
        const data = await fetchInstituicoes(controller.signal);
        setInstituicoes(data);
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        handleError(err, 'useInstituicoes');
        setError('Erro ao carregar instituições');
      } finally {
        setLoading(false);
      }
    };

    loadInstituicoes();

    return () => {
      controller.abort();
    };
  }, []);

  return { instituicoes, loading, error };
}
