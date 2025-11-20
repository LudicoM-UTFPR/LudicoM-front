import type { Evento } from '../types';
import { API_BASE_URL } from '../constants';
import { validateEntityData, ENTITY_SCHEMAS, handleError } from '../utils';
import { getAuthHeaders } from './authService';

// Base helper para construir URL sem barras duplicadas
const base = API_BASE_URL?.replace(/\/+$/, '') || '';
const ENDPOINT = `${base}/evento`;

export async function fetchEventos(signal?: AbortSignal): Promise<Evento[]> {
  try {
    const res = await fetch(ENDPOINT, { signal, headers: getAuthHeaders() });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }
    const json = await res.json();
    // Validação e normalização conforme schema atualizado
    const validated = validateEntityData<Evento>(json, ENTITY_SCHEMAS.evento as any);
    return validated;
  } catch (e) {
    handleError(e, 'eventosService.fetchEventos');
    throw e;
  }
}

export async function createEvento(payload: Partial<Evento>): Promise<Evento> {
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
    const validated = validateEntityData<Evento>([json], ENTITY_SCHEMAS.evento as any)[0];
    return validated;
  } catch (e) {
    handleError(e, 'eventosService.createEvento');
    throw e;
  }
}

export async function updateEvento(id: number | string, changes: Partial<Evento>): Promise<Evento> {
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
    const validated = validateEntityData<Evento>([json], ENTITY_SCHEMAS.evento as any)[0];
    return validated;
  } catch (e) {
    handleError(e, 'eventosService.updateEvento');
    throw e;
  }
}

export async function deleteEvento(id: number | string): Promise<void> {
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
    handleError(e, 'eventosService.deleteEvento');
    throw e;
  }
}
