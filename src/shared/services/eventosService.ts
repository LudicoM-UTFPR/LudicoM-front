import type { Evento } from "../types";
import { API_BASE_URL } from "../constants";
import { validateEntityData, ENTITY_SCHEMAS, handleError } from "../utils";
import { getAuthHeaders } from "./authService";

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
      if (text) base = text.length < 500 ? text : base;
    }
  } catch { console.error('Falha ao extrair mensagem de erro detalhada do response'); }
  const generic: any = new Error(base);
  generic.status = res.status;
  return generic;
}

// Base helper para construir URL sem barras duplicadas
const base = API_BASE_URL?.replace(/\/+$/, "") || "";
const ENDPOINT = `${base}/evento`;

export async function fetchEventos(signal?: AbortSignal): Promise<Evento[]> {
  try {
    const res = await fetch(ENDPOINT, { signal, headers: getAuthHeaders() });
    if (!res.ok) throw await extractError(res);
    const json = await res.json();
    // Validação e normalização conforme schema atualizado
    let normalized = json;
    if (
      Array.isArray(json) &&
      json.length > 0 &&
      json[0] &&
      Object.prototype.hasOwnProperty.call(json[0], "uid") &&
      !Object.prototype.hasOwnProperty.call(json[0], "id")
    ) {
      // Use o uid do backend como id (UUID) para compatibilidade total
      normalized = json.map((item: any) => ({
        ...item,
        id: String(item.uid),
        uid: item.uid,
        horaInicio: String(item.horaInicio).substring(0, 5),
        horaFim: String(item.horaFim).substring(0, 5),
      }));
    }
    const validated: Evento[] = validateEntityData<Evento>(
      normalized,
      ENTITY_SCHEMAS.evento as any
    );
    return validated;
  } catch (e) {
    handleError(e, "eventosService.fetchEventos");
    throw e;
  }
}

export async function createEvento(payload: Partial<Evento>): Promise<Evento> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (res.status !== 201 && !res.ok) {
      if (json.errors) {
        const err: any = new Error(json.message || 'Erro de validação');
        err.errors = json.errors;
        err.status = res.status;
        throw err;
      }
      throw await extractError(res);
    }

    const validated = validateEntityData<Evento>(
      [json],
      ENTITY_SCHEMAS.evento as any
    )[0];
    return validated;
  } catch (e) {
    handleError(e, "eventosService.createEvento");
    throw e;
  }
}

export async function updateEvento(
  id: string,
  changes: Partial<Evento>
): Promise<Evento> {
  const url = `${ENDPOINT}/${encodeURIComponent(String(id))}`;
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(changes),
    });

    const json = await res.json();

    if (!res.ok) {
      if (json.errors) {
        const err: any = new Error(json.message || 'Erro de validação');
        err.errors = json.errors;
        err.status = res.status;
        throw err;
      }
      throw await extractError(res);
    }

    const normalized = { ...json, id: json.uid ? String(json.uid) : json.id };

    const validated = validateEntityData<Evento>(
      [normalized],
      ENTITY_SCHEMAS.evento as any
    )[0];
    return validated;
  } catch (e) {
    handleError(e, "eventosService.updateEvento");
    throw e;
  }
}

export async function deleteEvento(id: string): Promise<void> {
  const url = `${ENDPOINT}/${encodeURIComponent(String(id))}`;
  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      if (json.errors) {
        const err: any = new Error(json.message || 'Erro de validação');
        err.errors = json.errors;
        err.status = res.status;
        throw err;
      }
      throw await extractError(res);
    }
  } catch (e) {
    handleError(e, "eventosService.deleteEvento");
    throw e;
  }
}
