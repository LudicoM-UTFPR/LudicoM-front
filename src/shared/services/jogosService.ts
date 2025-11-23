import type { Jogo } from '../types';
import { API_BASE_URL } from '../constants';
import { validateEntityData, ENTITY_SCHEMAS } from '../utils';
import { handleError } from '../utils';
import { getAuthHeaders } from './authService';

// Utilitário para extrair mensagens detalhadas de erro do backend (JSON ou texto)
async function extractError(res: Response): Promise<Error> {
    let base = `HTTP ${res.status} - ${res.statusText}`;
    try {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const body = await res.json();
            // Convenções possíveis: { message: string, errors: Record<string,string>|string[] }
            if (body) {
                if (body.message && typeof body.message === 'string') {
                    base = body.message;
                }
                // Anexa erros estruturados (campo -> mensagem) se existirem
                const err: any = new Error(base);
                err.status = res.status;
                if (body.errors && typeof body.errors === 'object') {
                    (err as any).errors = body.errors;
                } else if (Array.isArray(body.errors)) {
                    // Converte array simples em objeto indexado
                    const mapped: Record<string,string> = {};
                    body.errors.forEach((msg: string, idx: number) => { mapped[`error_${idx}`] = msg; });
                    err.errors = mapped;
                }
                return err;
            }
        } else {
            const text = await res.text();
            if (text) {
                base = text.length < 500 ? text : base; // evita anexar texto gigante
            }
        }
    } catch {
        // Ignora falhas de parsing e usa base genérica
    }
    const generic: any = new Error(base);
    generic.status = res.status;
    return generic;
}

function normalizeJogoRecord(item: any): any {
    const out: any = { ...item };
    // uid -> id como string (UUID)
    if (out.uid && !out.id) out.id = String(out.uid);
    // anoPublicacao pode vir como string/ISO -> extrai ano
    if (out.anoPublicacao !== undefined && out.anoPublicacao !== null) {
        if (typeof out.anoPublicacao === 'string') {
            const m = out.anoPublicacao.match(/^(\d{4})/);
            out.anoPublicacao = m ? Number(m[1]) : Number(out.anoPublicacao);
        }
        if (Number.isNaN(out.anoPublicacao)) out.anoPublicacao = 0;
    }
    // Coerção segura para campos numéricos
    const numericKeys = ['tempoDeJogo', 'minimoJogadores', 'maximoJogadores'];
    for (const k of numericKeys) {
        if (out[k] !== undefined) {
            const n = Number(out[k]);
            out[k] = Number.isNaN(n) ? 0 : n;
        }
    }
    return out;
}

export async function fetchJogos(signal?: AbortSignal): Promise<Jogo[]> {
    // API reference indicates endpoint is at /api/jogo (singular)
    const url = `${API_BASE_URL.replace(/\/+$/, '')}/jogo`;

    try {
        const res = await fetch(url, { 
            signal,
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            if (res.status === 401) {
                const err = await extractError(res);
                err.message = err.message + ' - Verifique as credenciais de autenticação';
                throw err;
            }
            throw await extractError(res);
        }

        const json = await res.json();

        // Normalização: alguns backends (referência JOGO.md) retornam 'uid' em vez de 'id'.
        // Para manter compatibilidade com o cliente atual (que usa ids numéricos), mapeamos
        // os objetos para incluir um id numérico sequencial quando necessário e preservamos
        // o uid original em uma propriedade 'uid'.
        let normalized = json;
        if (
            Array.isArray(json) &&
            json.length > 0 &&
            json[0] &&
            Object.prototype.hasOwnProperty.call(json[0], 'uid') &&
            !Object.prototype.hasOwnProperty.call(json[0], 'id')
        ) {
            // Use o uid do backend como id (UUID) para compatibilidade total
            normalized = json.map((item: any) => normalizeJogoRecord({ ...item, id: String(item.uid), uid: item.uid }));
        } else if (Array.isArray(json)) {
            normalized = json.map((item: any) => normalizeJogoRecord(item));
        }

        // Valida e normaliza campos esperados pelo cliente
        const validated: Jogo[] = validateEntityData<Jogo>(normalized, ENTITY_SCHEMAS.jogo as any);

        return validated;
    } catch (error) {
        handleError(error, 'jogosService.fetchJogos');
        throw error;
    }
}

export async function createJogo(payload: Partial<Jogo>): Promise<Jogo> {
    const url = `${API_BASE_URL.replace(/\/+$/, '')}/jogo`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (res.status !== 201 && !res.ok) {
            throw await extractError(res);
        }

        const json = await res.json();
        // Normalize uid -> id e tipos
        const normalized = normalizeJogoRecord({ ...json, id: json.uid ? String(json.uid) : json.id });
        const validated = validateEntityData<Jogo>([normalized], ENTITY_SCHEMAS.jogo as any)[0];
        return validated;
    } catch (error) {
        handleError(error, 'jogosService.createJogo');
        throw error;
    }
}

export async function updateJogo(id: string, payload: Partial<Jogo>): Promise<Jogo> {
    const url = `${API_BASE_URL.replace(/\/+$/, '')}/jogo/${encodeURIComponent(id)}`;
    try {
        const res = await fetch(url, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            throw await extractError(res);
        }
        const json = await res.json();
        const normalized = normalizeJogoRecord({ ...json, id: json.uid ? String(json.uid) : json.id });
        const validated = validateEntityData<Jogo>([normalized], ENTITY_SCHEMAS.jogo as any)[0];
        return validated;
    } catch (error) {
        handleError(error, 'jogosService.updateJogo');
        throw error;
    }
}

export async function deleteJogo(id: string): Promise<void> {
    const url = `${API_BASE_URL.replace(/\/+$/, '')}/jogo/${encodeURIComponent(id)}`;
    try {
        const res = await fetch(url, { 
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            throw await extractError(res);
        }
    } catch (error) {
        handleError(error, 'jogosService.deleteJogo');
        throw error;
    }
}
