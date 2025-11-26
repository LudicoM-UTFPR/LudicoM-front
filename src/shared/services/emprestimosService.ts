import type { Emprestimo } from "../types";
import { API_BASE_URL } from "../constants";
import { validateEntityData, ENTITY_SCHEMAS, handleError, ensureHHMMSS } from "../utils";
import { getAuthHeaders } from "./authService";

// Base helper para construir URL sem barras duplicadas
const base = API_BASE_URL?.replace(/\/+$/, "") || "";
const ENDPOINT = `${base}/emprestimo`;

export async function fetchEmprestimos(signal?: AbortSignal): Promise<Emprestimo[]> {
  try {
    const res = await fetch(ENDPOINT, { signal, headers: getAuthHeaders() });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }
    const json = await res.json();
    // Validação e normalização conforme schema atualizado
    let normalized = json;
    
    // Se não for array, retorna vazio
    if (!Array.isArray(json)) {
      return [];
    }
    
    // Se array vazio, retorna vazio
    if (json.length === 0) {
      return [];
    }
    
    if (
      json[0] &&
      Object.prototype.hasOwnProperty.call(json[0], "uid") &&
      !Object.prototype.hasOwnProperty.call(json[0], "id")
    ) {
      // Use o uid do backend como id (UUID) para compatibilidade total
      normalized = json.map((item: any) => {
        const jogoObj = item.jogo;
        const participanteObj = item.participante;
        const eventoObj = item.evento;
        const horaEmp = item.horaEmprestimo ? String(item.horaEmprestimo).substring(0, 5) : '';
        const horaDev = item.horaDevolucao ? String(item.horaDevolucao).substring(0, 5) : null;
        
        return {
          ...item,
          id: String(item.uid),
          uid: item.uid,
          idJogo: item.idJogo || (jogoObj?.uid ? String(jogoObj.uid) : undefined),
          idParticipante: item.idParticipante || (participanteObj?.uid ? String(participanteObj.uid) : undefined),
          idEvento: item.idEvento || (eventoObj?.uid ? String(eventoObj.uid) : undefined),
          jogo: jogoObj?.nome || item.jogo || '',
          participante: participanteObj?.nome || item.participante || '',
          horario: horaEmp,
          horaEmprestimo: horaEmp,
          horaDevolucao: horaDev,
        };
      });
    }
    const validated: Emprestimo[] = validateEntityData<Emprestimo>(
      normalized,
      ENTITY_SCHEMAS.emprestimo as any
    );
    return validated;
  } catch (e) {
    handleError(e, "emprestimosService.fetchEmprestimos (retornando array vazio)");
    // Retorna array vazio ao invés de propagar erro, permitindo UI funcionar
    return [];
  }
}

export async function createEmprestimo(payload: Partial<Emprestimo>): Promise<Emprestimo> {
  try {
    // Normaliza horários para HH:mm:ss antes de enviar
    const normalizedPayload = {
      ...payload,
      horaEmprestimo: payload.horaEmprestimo ? ensureHHMMSS(payload.horaEmprestimo) : undefined,
      horaDevolucao: payload.horaDevolucao ? ensureHHMMSS(payload.horaDevolucao) : undefined,
    };

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(normalizedPayload),
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

    const validated = validateEntityData<Emprestimo>(
      [json],
      ENTITY_SCHEMAS.emprestimo as any
    )[0];
    return validated;
  } catch (e) {
    handleError(e, "emprestimosService.createEmprestimo");
    throw e;
  }
}

export async function updateEmprestimo(
  id: string,
  changes: Partial<Emprestimo>
): Promise<Emprestimo> {
  const url = `${ENDPOINT}/${encodeURIComponent(String(id))}`;
  try {
    // Normaliza horários para HH:mm:ss antes de enviar
    const normalizedChanges = {
      ...changes,
      horaEmprestimo: changes.horaEmprestimo ? ensureHHMMSS(changes.horaEmprestimo) : undefined,
      horaDevolucao: changes.horaDevolucao ? ensureHHMMSS(changes.horaDevolucao) : undefined,
    };

    const res = await fetch(url, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(normalizedChanges),
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

    const validated = validateEntityData<Emprestimo>(
      [normalized],
      ENTITY_SCHEMAS.emprestimo as any
    )[0];
    return validated;
  } catch (e) {
    handleError(e, "emprestimosService.updateEmprestimo");
    throw e;
  }
}

export async function deleteEmprestimo(id: string): Promise<void> {
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
    handleError(e, "emprestimosService.deleteEmprestimo");
    throw e;
  }
}

// Endpoint específico para devolver empréstimo via código de barras do jogo
// POST /emprestimo/devolver { codigoDeBarras: string }
export async function devolverEmprestimo(codigoDeBarras: string): Promise<Emprestimo | null> {
  const url = `${ENDPOINT}/devolver`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ codigoDeBarras })
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      if (json && json.errors) {
        const error: any = new Error(json.message || 'Erro ao devolver empréstimo');
        error.errors = json.errors;
        error.status = res.status;
        throw error;
      }
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }
    if (!json) return null;
    // Tenta normalizar se vier estrutura semelhante às demais
    let normalized = json;
    if (json.uid && !json.id) {
      normalized = { ...json, id: String(json.uid) };
    }
    try {
      const validated = validateEntityData<Emprestimo>([normalized], ENTITY_SCHEMAS.emprestimo as any)[0];
      return validated;
    } catch {
      // Se não conseguir validar, retorna null para tratamento local
      return null;
    }
  } catch (e) {
    handleError(e, 'emprestimosService.devolverEmprestimo');
    throw e;
  }
}
