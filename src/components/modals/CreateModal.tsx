import React, { useState, useEffect } from 'react';

export interface CreateField<T> {
  key: keyof T;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'boolean' | 'select' | 'autocomplete';
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: { value: string | number | boolean; label: string }[];
  validation?: (value: any) => string | null;
  dataListId?: string; // Para autocomplete
}

export interface CreateModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newItem: Omit<T, 'id'>) => void;
  fields: CreateField<T>[];
  title?: string;
}

export function CreateModal<T extends { id: number | string }>({ 
  isOpen, 
  onClose, 
  onSave,
  fields, 
  title = 'Criar Novo Item' 
}: CreateModalProps<T>) {
  const [formData, setFormData] = useState<Partial<Omit<T, 'id'>>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializa o formulário com valores padrão quando abre
  useEffect(() => {
    if (isOpen) {
      const initialData: Partial<Omit<T, 'id'>> = {};
      fields.forEach(field => {
        if (field.key !== 'id' && field.defaultValue !== undefined) {
          initialData[field.key as keyof Omit<T, 'id'>] = field.defaultValue;
        }
      });
      setFormData(initialData);
      setErrors({});
    }
  }, [isOpen, fields]);

  if (!isOpen) return null;

  const handleInputChange = (key: keyof T, value: any) => {
    if (key === 'id') return; // Não permite editar ID
    
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));

    // Limpa erro do campo quando o usuário edita
    if (errors[key as string]) {
      setErrors(prev => ({
        ...prev,
        [key as string]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      if (field.key === 'id') return; // Pula validação do ID
      
      const value = formData[field.key as keyof Omit<T, 'id'>];
      
      // Validação de campo obrigatório
      if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        newErrors[field.key as string] = `${field.label} é obrigatório`;
        return;
      }

      // Validação customizada
      if (field.validation && value !== undefined && value !== null) {
        const validationError = field.validation(value);
        if (validationError) {
          newErrors[field.key as string] = validationError;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData as Omit<T, 'id'>);
      onClose();
      // Limpa o formulário após salvar
      setFormData({});
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderField = (field: CreateField<T>) => {
    if (field.key === 'id') return null; // Não renderiza campo ID
    
    const value = formData[field.key as keyof Omit<T, 'id'>];
    const error = errors[field.key as string];

    switch (field.type) {
      case 'boolean':
        return (
          <label className="field-checkbox">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleInputChange(field.key, e.target.checked)}
            />
            <span className="field-label">{field.label}</span>
          </label>
        );

      case 'select':
        return (
          <select
            className={`field-input ${error ? 'error' : ''}`}
            value={String(value || '')}
            onChange={(e) => {
              const selectedValue = field.options?.find(opt => String(opt.value) === e.target.value)?.value;
              handleInputChange(field.key, selectedValue);
            }}
          >
            <option value="">Selecione...</option>
            {field.options?.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'autocomplete':
        return (
          <>
            <input
              type="text"
              className={`field-input ${error ? 'error' : ''}`}
              value={String(value || '')}
              placeholder={field.placeholder}
              list={field.dataListId}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
            />
            <datalist id={field.dataListId}>
              {field.options?.map((option) => (
                <option key={String(option.value)} value={String(option.label)} />
              ))}
            </datalist>
          </>
        );

      case 'number':
        return (
          <input
            type="number"
            className={`field-input ${error ? 'error' : ''}`}
            value={value !== undefined && value !== null ? String(value) : ''}
            placeholder={field.placeholder}
            onChange={(e) => handleInputChange(field.key, Number(e.target.value) || 0)}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            className={`field-input ${error ? 'error' : ''}`}
            value={value ? String(value).split('T')[0] : ''}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
          />
        );

      default: // text, email
        return (
          <input
            type={field.type}
            className={`field-input ${error ? 'error' : ''}`}
            value={String(value || '')}
            placeholder={field.placeholder}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal modal--edit">
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
        
        <form onSubmit={handleSubmit} className="edit-modal-form">
          <div className="modal-content">
            <div className="edit-fields">
              {fields.map((field) => {
                if (field.key === 'id') return null; // Não renderiza campo ID
                
                return (
                  <div key={field.key as string} className="edit-field">
                    {field.type !== 'boolean' && (
                      <label className="field-label">
                        {field.label}
                        {field.required && <span className="required">*</span>}
                      </label>
                    )}
                    
                    {renderField(field)}
                    
                    {errors[field.key as string] && (
                      <span className="field-error">
                        {errors[field.key as string]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="modal-footer">
            <div className="acoes-grupo">
              <button 
                type="button"
                className="action-btn action-btn--secondary" 
                onClick={onClose}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="action-btn action-btn--primary"
              >
                Criar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}