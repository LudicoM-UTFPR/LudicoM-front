import type { Instituicao } from '../types';
import { API_BASE_URL } from '../constants';
import { validateEntityData, ENTITY_SCHEMAS, handleError } from '../utils';
import { getAuthHeaders } from './authService';

// Base helper para construir URL sem barras duplicadas
const base = API_BASE_URL?.replace(/\/+$/, '') || '';
const ENDPOINT = `${base}/instituicao`;

export async function fetchInstituicoes(signal?: AbortSignal): Promise<Instituicao[]> {
  try {
    const res = await fetch(ENDPOINT, { signal, headers: getAuthHeaders() });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }
    const json = await res.json();
    // Validação e normalização conforme schema atualizado
    const validated = validateEntityData<Instituicao>(json, ENTITY_SCHEMAS.instituicao as any);
    return validated;
  } catch (e) {
    handleError(e, 'instituicaoService.fetchInstituicoes');
    throw e;
  }
}

export async function createInstituicao(payload: Partial<Instituicao>): Promise<Instituicao> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (res.status !== 201 && !res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }
    const json = await res.json();
    const validated = validateEntityData<Instituicao>([json], ENTITY_SCHEMAS.instituicao as any)[0];
    return validated;
  } catch (e) {
    handleError(e, 'instituicaoService.createInstituicao');
    throw e;
  }
}

export async function updateInstituicao(id: number | string, changes: Partial<Instituicao>): Promise<Instituicao> {
  const url = `${ENDPOINT}/${encodeURIComponent(String(id))}`;
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(changes)
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }
    const json = await res.json();
    const validated = validateEntityData<Instituicao>([json], ENTITY_SCHEMAS.instituicao as any)[0];
    return validated;
  } catch (e) {
    handleError(e, 'instituicaoService.updateInstituicao');
    throw e;
  }
}

export async function deleteInstituicao(id: number | string): Promise<void> {
  const url = `${ENDPOINT}/${encodeURIComponent(String(id))}`;
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }
  } catch (e) {
    handleError(e, 'instituicaoService.deleteInstituicao');
    throw e;
  }
}
