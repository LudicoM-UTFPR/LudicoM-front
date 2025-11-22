import type { Evento } from "../types";
import { API_BASE_URL } from "../constants";
import { validateEntityData, ENTITY_SCHEMAS, handleError } from "../utils";
import { getAuthHeaders } from "./authService";

// Base helper para construir URL sem barras duplicadas
const base = API_BASE_URL?.replace(/\/+$/, "") || "";
const ENDPOINT = `${base}/evento`;

export async function fetchEventos(signal?: AbortSignal): Promise<Evento[]> {
  try {
    const res = await fetch(ENDPOINT, { signal, headers: getAuthHeaders() });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }
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
      // Se houver erros de validação, propaga com a estrutura
      if (json.errors) {
        const error: any = new Error(json.message || "Erro de validação");
        error.errors = json.errors;
        error.status = res.status;
        throw error;
      }
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
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
  id: number | string,
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
      // Se houver erros de validação, propaga com a estrutura
      if (json.errors) {
        const error: any = new Error(json.message || "Erro de validação");
        error.errors = json.errors;
        error.status = res.status;
        throw error;
      }
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
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

export async function deleteEvento(id: number | string): Promise<void> {
  const url = `${ENDPOINT}/${encodeURIComponent(String(id))}`;
  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      // Se houver erros de validação, propaga com a estrutura
      if (json.errors) {
        const error: any = new Error(json.message || "Erro de validação");
        error.errors = json.errors;
        error.status = res.status;
        throw error;
      }
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }
  } catch (e) {
    handleError(e, "eventosService.deleteEvento");
    throw e;
  }
}
