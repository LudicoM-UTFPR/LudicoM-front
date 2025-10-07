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
 * Gera ID único para elementos
 */
export const generateId = (prefix: string = 'id'): string => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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