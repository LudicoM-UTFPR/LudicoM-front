import type { Participante, Instituicao } from '../types';
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
  } catch { /* ignore */ }
  const generic: any = new Error(base);
  generic.status = res.status;
  return generic;
}

const base = API_BASE_URL?.replace(/\/+$/, '') || '';
const ENDPOINT = `${base}/participante`;

function normalize(record: any): any {
  const out: any = { ...record };
  if (out.uid && !out.id) out.id = String(out.uid);
  if (out.instituicao && typeof out.instituicao === 'object') {
    // garante shape esperado
    const inst: any = out.instituicao;
    out.instituicao = {
      uid: String(inst.uid || ''),
      nome: String(inst.nome || ''),
      endereco: String(inst.endereco || '')
    };
    out.idInstituicao = out.instituicao.uid || out.idInstituicao;
  } else {
    if (out.idInstituicao && !out.instituicao) {
      out.instituicao = { uid: String(out.idInstituicao), nome: '', endereco: '' };
    }
  }
  return out;
}

export async function fetchParticipantes(signal?: AbortSignal): Promise<Participante[]> {
  try {
    const res = await fetch(ENDPOINT, { signal, headers: getAuthHeaders() });
    if (!res.ok) throw await extractError(res);
    const json = await res.json();
    const normalized = Array.isArray(json) ? json.map(normalize) : [];
    const validated = validateEntityData<Participante>(normalized, ENTITY_SCHEMAS.participante as any);
    return validated;
  } catch (e) {
    handleError(e, 'participanteService.fetchParticipantes');
    throw e;
  }
}

export async function createParticipante(payload: Partial<Participante>): Promise<Participante> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (res.status !== 201 && !res.ok) throw await extractError(res);
    const json = await res.json();
    const normalized = normalize(json);
    const validated = validateEntityData<Participante>([normalized], ENTITY_SCHEMAS.participante as any)[0];
    return validated;
  } catch (e) {
    handleError(e, 'participanteService.createParticipante');
    throw e;
  }
}

export async function updateParticipante(id: string, changes: Partial<Participante>): Promise<Participante> {
  const url = `${ENDPOINT}/${encodeURIComponent(String(id))}`;
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(changes)
    });
    if (!res.ok) throw await extractError(res);
    const json = await res.json();
    const normalized = normalize(json);
    const validated = validateEntityData<Participante>([normalized], ENTITY_SCHEMAS.participante as any)[0];
    return validated;
  } catch (e) {
    handleError(e, 'participanteService.updateParticipante');
    throw e;
  }
}

export async function deleteParticipante(id: string): Promise<void> {
  const url = `${ENDPOINT}/${encodeURIComponent(String(id))}`;
  try {
    const res = await fetch(url, { method: 'DELETE', headers: getAuthHeaders() });
    if (!res.ok) throw await extractError(res);
  } catch (e) {
    handleError(e, 'participanteService.deleteParticipante');
    throw e;
  }
}
