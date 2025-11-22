/**
 * Utilitários para manipulação de strings e segurança
 */

/**
 * Escapa caracteres HTML para prevenir XSS
 */
export const escapeHtml = (str: unknown): string => {
    if (typeof str !== "string") return String(str || "");
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

/**
 * Filtra items baseado em múltiplos campos de texto
 */
export const filterByMultipleFields = <T extends Record<string, any>>(
    items: T[],
    searchTerm: string,
    fields: (keyof T)[]
): T[] => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;
    
    return items.filter(item =>
        fields.some(field => {
            const value = item[field];
            return value && String(value).toLowerCase().includes(term);
        })
    );
};

/**
 * Debounce function para otimizar performance em buscas
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Formata data/hora para exibição
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(dateObj);
};

/**
 * Formata uma Date (ou ISO) para hora no formato HH:mm
 */
export const formatTimeHHMM = (input?: Date | string | number): string => {
    const d = input instanceof Date ? input : (input ? new Date(input) : new Date());
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
};

/**
 * Converte uma string ISO (ou outro formato aceito pelo constructor Date) para HH:mm.
 * Retorna null quando não há valor válido.
 */
export const isoToHHMM = (iso?: string | null): string | null => {
    if (!iso) return null;
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return null;
        return formatTimeHHMM(d);
    } catch {
        return null;
    }
};

// --- Local state persistence (mock) ---------------------------------
const LOCAL_DEVOLVIDOS_KEY = 'ludicom:emprestimos:devolvidos';

export const getDevolvidosLocal = (): Record<string, string> => {
    try {
        const raw = localStorage.getItem(LOCAL_DEVOLVIDOS_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return {};
        return parsed as Record<string, string>;
    } catch {
        return {};
    }
};

export const markEmprestimoDevolvidoLocal = (id: number, hora?: string) => {
    try {
        const map = getDevolvidosLocal();
        map[String(id)] = hora || formatTimeHHMM(new Date());
        localStorage.setItem(LOCAL_DEVOLVIDOS_KEY, JSON.stringify(map));
    } catch (e) {
        // silent
    }
};

/**
 * Gera ID único para elementos
 */
export const generateId = (prefix: string = 'id'): string => {
    // Gera UUIDv4 e opcionalmente adiciona prefixo para legibilidade
    const uuidv4 = (): string => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    };

    const uuid = uuidv4();
    return prefix ? `${prefix}-${uuid}` : uuid;
};

/**
 * Valida se um valor não é null nem undefined
 */
export const isNotNullish = <T>(value: T | null | undefined): value is T => {
    return value !== null && value !== undefined;
};

/**
 * Função helper para tratamento de erros
 */
export const handleError = (error: unknown, context: string = 'Unknown'): void => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${context}]: ${errorMessage}`);
};

/**
 * Validação genérica de dados de entidades
 * Padroniza a conversão e validação de tipos
 */
export const validateEntityData = <T extends Record<string, any>>(
    rawData: any[],
    entitySchema: Record<keyof T, 'number' | 'string' | 'boolean' | 'date'>
): T[] => {
    return rawData.map((item): T => {
        const validatedItem: Partial<T> = {};
        
        Object.entries(entitySchema).forEach(([key, type]) => {
            const value = item[key];
            
            switch (type) {
                case 'number':
                    validatedItem[key as keyof T] = Number(value || 0) as T[keyof T];
                    break;
                case 'string':
                    validatedItem[key as keyof T] = String(value || "") as T[keyof T];
                    break;
                case 'boolean':
                    validatedItem[key as keyof T] = Boolean(value) as T[keyof T];
                    break;
                case 'date':
                    validatedItem[key as keyof T] = String(value || "") as T[keyof T];
                    break;
                default:
                    validatedItem[key as keyof T] = value as T[keyof T];
            }
        });
        
        return validatedItem as T;
    });
};

// Schemas de validação para as entidades
export const ENTITY_SCHEMAS = {
    jogo: {
        // Agora o id dos jogos é tratado como string (UUID) para compatibilidade com o backend
        id: 'string' as const,
        nome: 'string' as const,
        nomeAlternativo: 'string' as const,
        anoPublicacao: 'number' as const,
        tempoDeJogo: 'number' as const,
        minimoJogadores: 'number' as const,
        maximoJogadores: 'number' as const,
        codigoDeBarras: 'string' as const,
        isDisponivel: 'boolean' as const,
        criadoQuando: 'string' as const,
        atualizadoQuando: 'string' as const
    },
    instituicao: {
        uid: 'string' as const,
        nome: 'string' as const,
        endereco: 'string' as const
    },
    participante: {
        id: 'number' as const,
        nome: 'string' as const,
        email: 'string' as const,
        documento: 'string' as const,
        ra: 'string' as const
    },
    evento: {
        id: 'string' as const,
        data: 'string' as const,
        idInstituicao: 'string' as const,
        instituicao: 'instituicao' as const,
        horaInicio: 'string' as const,
        horaFim: 'string' as const
    },
    emprestimo: {
        id: 'number' as const,
        idJogo: 'number' as const,
        idParticipante: 'number' as const,
        idEvento: 'number' as const,
        horaEmprestimo: 'string' as const,
        horaDevolucao: 'string' as const,
        isDevolvido: 'boolean' as const,
        observacoes: 'string' as const
    }
} as const;

// Validações centralizadas
export * from './validations';