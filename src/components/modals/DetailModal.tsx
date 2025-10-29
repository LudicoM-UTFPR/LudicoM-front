import React from 'react';

export interface DetailField<T> {
  key: keyof T;
  label: string;
  type?: 'text' | 'date' | 'boolean' | 'number' | 'array' | 'custom';
  render?: (value: T[keyof T], item: T) => React.ReactNode;
}

export interface DetailModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  item: T | null;
  fields: DetailField<T>[];
  title?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export function DetailModal<T>({ 
  isOpen, 
  onClose, 
  item, 
  fields, 
  title = 'Detalhes',
  onEdit,
  onDelete
}: DetailModalProps<T>) {
  if (!isOpen || !item) return null;

  const formatValue = (field: DetailField<T>, value: T[keyof T], item: T) => {
    if (field.render) {
      return field.render(value, item);
    }

    if (value === null || value === undefined) {
      return '-';
    }

    switch (field.type) {
      case 'boolean':
        return value ? 'Sim' : 'Não';
      case 'date':
        return new Date(value as string).toLocaleDateString('pt-BR');
      case 'array':
        return Array.isArray(value) ? value.join(', ') : String(value);
      case 'number':
        return typeof value === 'number' ? value.toLocaleString('pt-BR') : String(value);
      default:
        return String(value);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal modal--detail">
        <div className="modal-header">
          <h2>{title}</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            type="button"
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>
        
        <div className="modal-content">
          <div className="detail-fields">
            {fields.map((field) => (
              <div key={field.key as string} className="detail-field">
                <label className="field-label">
                  {field.label}:
                </label>
                <div className="detail-field-value">
                  {formatValue(field, item[field.key], item)}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="modal-footer">
          <div className="acoes-grupo">
            {onEdit && (
              <button 
                className="action-btn action-btn--secondary" 
                onClick={() => onEdit(item)}
                type="button"
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button 
                className="action-btn action-btn--danger" 
                onClick={() => onDelete(item)}
                type="button"
              >
                Excluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}