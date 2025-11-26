import type { Instituicao } from '../types';
import { API_BASE_URL } from '../constants';
import { validateEntityData, ENTITY_SCHEMAS, handleError } from '../utils';
import { getAuthHeaders } from './authService';
async function extractError(res: Response): Promise<Error> {
  let base = `HTTP ${res.status} - ${res.statusText}`;
  try {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await res.json();
      if (body) {
        if (typeof body.message === 'string') base = body.message;
        const err: any = new Error(base);
        err.status = res.status;
        if (body.errors && typeof body.errors === 'object') err.errors = body.errors;
        else if (Array.isArray(body.errors)) {
          const mapped: Record<string,string> = {};
          body.errors.forEach((m: string, i: number) => mapped[`error_${i}`] = m);
          err.errors = mapped;
        }
        return err;
      }
    } else {
      const text = await res.text();
      if (text) base = text.length < 400 ? text : base;
    }
  } catch { console.error('Falha ao extrair mensagem de erro detalhada do response'); }
  const generic: any = new Error(base);
  generic.status = res.status;
  return generic;
}

// Base helper para construir URL sem barras duplicadas
const base = API_BASE_URL?.replace(/\/+$/, '') || '';
const ENDPOINT = `${base}/instituicao`;

export async function fetchInstituicoes(signal?: AbortSignal): Promise<Instituicao[]> {
  try {
    const res = await fetch(ENDPOINT, { signal, headers: getAuthHeaders() });
    if (!res.ok) throw await extractError(res);
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
    if (res.status !== 201 && !res.ok) throw await extractError(res);
    const json = await res.json();
    const validated = validateEntityData<Instituicao>([json], ENTITY_SCHEMAS.instituicao as any)[0];
    return validated;
  } catch (e) {
    handleError(e, 'instituicaoService.createInstituicao');
    throw e;
  }
}

export async function updateInstituicao(id: string, changes: Partial<Instituicao>): Promise<Instituicao> {
  const url = `${ENDPOINT}/${encodeURIComponent(String(id))}`;
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(changes)
    });
    if (!res.ok) throw await extractError(res);
    const json = await res.json();
    const validated = validateEntityData<Instituicao>([json], ENTITY_SCHEMAS.instituicao as any)[0];
    return validated;
  } catch (e) {
    handleError(e, 'instituicaoService.updateInstituicao');
    throw e;
  }
}

export async function deleteInstituicao(id: string): Promise<void> {
  const url = `${ENDPOINT}/${encodeURIComponent(String(id))}`;
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw await extractError(res);
  } catch (e) {
    handleError(e, 'instituicaoService.deleteInstituicao');
    throw e;
  }
}
