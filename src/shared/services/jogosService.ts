import type { Jogo } from '../types';
import { API_BASE_URL } from '../constants';
import { validateEntityData, ENTITY_SCHEMAS } from '../utils';
import { handleError } from '../utils';
import { getAuthHeaders } from './authService';

export async function fetchJogos(signal?: AbortSignal): Promise<Jogo[]> {
    // API reference indicates endpoint is at /api/jogo (singular)
    const url = `${API_BASE_URL.replace(/\/+$/, '')}/jogo`;

    try {
        const res = await fetch(url, { 
            signal,
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            let errorMessage = `HTTP ${res.status} - ${res.statusText}`;
            if (res.status === 401) {
                errorMessage += ' - Verifique as credenciais de autenticação';
                console.error('Headers enviados:', getAuthHeaders());
            }
            throw new Error(errorMessage);
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
            normalized = json.map((item: any) => ({ ...item, id: String(item.uid), uid: item.uid }));
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
            throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        }

        const json = await res.json();
        // Normalize uid -> id
        const normalized = { ...json, id: json.uid ? String(json.uid) : json.id };
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
            throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        }
        const json = await res.json();
        const normalized = { ...json, id: json.uid ? String(json.uid) : json.id };
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
            throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        }
    } catch (error) {
        handleError(error, 'jogosService.deleteJogo');
        throw error;
    }
}
