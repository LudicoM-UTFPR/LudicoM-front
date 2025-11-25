import React, { useState, useEffect, useRef } from 'react';
import { Autocomplete } from '../common';

export interface CreateField<T> {
  key: keyof T;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'time' | 'boolean' | 'select' | 'autocomplete';
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
  // Ações inline reutilizáveis por campo (exibir botão dentro do input)
  inlineFieldActions?: Record<string, { label?: string; title?: string; icon?: React.ReactNode; onClick: () => void }>;
  // Prefill externo: quando muda, mescla valores no form sem reinicializar tudo
  prefill?: Partial<Omit<T, 'id'>>;
  // Mensagem informativa no topo do modal (ex: evento atual)
  infoMessage?: string | React.ReactNode;
}

export function CreateModal<T extends { id: number | string }>({ 
  isOpen, 
  onClose, 
  onSave,
  fields, 
  title = 'Criar Novo Item',
  inlineFieldActions,
  prefill,
  infoMessage
}: CreateModalProps<T>) {
  const [formData, setFormData] = useState<Partial<Omit<T, 'id'>>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  // ID único por instância para evitar conflitos quando múltiplos modais estão abertos
  const formIdRef = useRef<string>(() => {
    const rnd = Math.random().toString(36).slice(2, 9);
    return `create-modal-form-${Date.now()}-${rnd}`;
  });
  // Corrige valor real (useRef inicial pode ser função se não invocada)
  if (typeof formIdRef.current === 'function') {
    formIdRef.current = (formIdRef.current as unknown as () => string)();
  }

  // Bloqueia scroll da página quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Inicializa o formulário com valores padrão quando abre
  useEffect(() => {
    if (isOpen) {
      const initialData: Partial<Omit<T, 'id'>> = {};
      fields.forEach(field => {
        if (field.key !== 'id' && field.defaultValue !== undefined) {
          // Se o defaultValue é uma função, executa para obter valor atualizado
          const value = typeof field.defaultValue === 'function' 
            ? field.defaultValue() 
            : field.defaultValue;
          initialData[field.key as keyof Omit<T, 'id'>] = value;
        }
      });
      // Aplica prefill inicial (se vier junto na primeira abertura)
      if (prefill) {
        Object.entries(prefill).forEach(([k, v]) => {
          if (k !== 'id') (initialData as any)[k] = v;
        });
      }
      setFormData(initialData);
      setErrors({});
    }
  }, [isOpen, fields]);

  // Prefill dinâmico: quando prop prefill muda enquanto modal aberto
  useEffect(() => {
    if (isOpen && prefill && Object.keys(prefill).length) {
      setFormData(prev => ({ ...prev, ...prefill }));
    }
  }, [prefill, isOpen]);

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
      // Não fecha mais automaticamente - deixa o handler da página controlar
      // onClose();
      // Não limpa mais o formulário aqui - será limpo quando reabrir o modal
      // setFormData({});
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
    const action = inlineFieldActions && inlineFieldActions[field.key as string];

    // Esconde horaDevolucao se isDevolvido não estiver marcado
    if (field.key === 'horaDevolucao' && !formData['isDevolvido' as keyof Omit<T, 'id'>]) {
      return null;
    }

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
          <div className={`select-wrapper${action ? ' with-action' : ''}`}>
            <div className={`input-with-action${action ? ' has-action' : ''}`}>
            <select
              className={`field-input ${error ? 'error' : ''} ${action ? 'has-inline-action' : ''}`}
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
            {action && (
              <button
                type="button"
                className="field-inline-action-btn"
                title={action.title || action.label}
                onClick={action.onClick}
              >
                {action.icon || action.label || '+'}
              </button>
            )}
            </div>
          </div>
        );

      case 'autocomplete':
        return (
          <div className={`autocomplete-wrapper${action ? ' with-action' : ''}`}>
            <div className={`input-with-action${action ? ' has-action' : ''}`}>
            <Autocomplete
              value={String(value || '')}
              onChange={(newValue) => handleInputChange(field.key, newValue)}
              options={field.options || []}
              placeholder={field.placeholder}
              className={`field-input ${error ? 'error' : ''} ${action ? 'has-inline-action' : ''}`}
            />
            {action && (
              <button
                type="button"
                className="field-inline-action-btn"
                title={action.title || action.label}
                onClick={action.onClick}
              >
                {action.icon || action.label || '+'}
              </button>
            )}
            </div>
          </div>
        );

      case 'number':
        return (
          <div className={`number-wrapper${action ? ' with-action' : ''}`}>
            <div className={`input-with-action${action ? ' has-action' : ''}`}>
            <input
              type="number"
              className={`field-input ${error ? 'error' : ''} ${action ? 'has-inline-action' : ''}`}
              value={value !== undefined && value !== null ? String(value) : ''}
              placeholder={field.placeholder}
              onChange={(e) => handleInputChange(field.key, Number(e.target.value) || 0)}
            />
            {action && (
              <button
                type="button"
                className="field-inline-action-btn"
                title={action.title || action.label}
                onClick={action.onClick}
              >
                {action.icon || action.label || '+'}
              </button>
            )}
            </div>
          </div>
        );

      case 'date':
        return (
          <div className={`date-wrapper${action ? ' with-action' : ''}`}>
            <div className={`input-with-action${action ? ' has-action' : ''}`}>
            <input
              type="date"
              className={`field-input ${error ? 'error' : ''} ${action ? 'has-inline-action' : ''}`}
              value={value ? String(value).split('T')[0] : ''}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
            />
            {action && (
              <button
                type="button"
                className="field-inline-action-btn"
                title={action.title || action.label}
                onClick={action.onClick}
              >
                {action.icon || action.label || '+'}
              </button>
            )}
            </div>
          </div>
        );

      case 'time':
        return (
          <div className={`time-wrapper${action ? ' with-action' : ''}`}>
            <div className={`input-with-action${action ? ' has-action' : ''}`}>
            <input
              type="time"
              className={`field-input ${error ? 'error' : ''} ${action ? 'has-inline-action' : ''}`}
              value={value ? String(value).substring(0, 5) : ''}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
            />
            {action && (
              <button
                type="button"
                className="field-inline-action-btn"
                title={action.title || action.label}
                onClick={action.onClick}
              >
                {action.icon || action.label || '+'}
              </button>
            )}
            </div>
          </div>
        );

      default: // text, email
        return (
          <div className={`text-wrapper${action ? ' with-action' : ''}`}>
            <div className={`input-with-action${action ? ' has-action' : ''}`}>
            <input
              type={field.type}
              className={`field-input ${error ? 'error' : ''} ${action ? 'has-inline-action' : ''}`}
              value={String(value || '')}
              placeholder={field.placeholder}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
            />
            {action && (
              <button
                type="button"
                className="field-inline-action-btn"
                title={action.title || action.label}
                onClick={action.onClick}
              >
                {action.icon || action.label || '+'}
              </button>
            )}
            </div>
          </div>
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
        
        <div className="modal-content">
          <form id={formIdRef.current} onSubmit={handleSubmit} className="edit-modal-form">
            {infoMessage && (
              <div className="modal-info-message" style={{
                padding: '12px 16px',
                marginBottom: '20px',
                backgroundColor: '#e3f2fd',
                border: '1px solid #2196f3',
                borderRadius: '6px',
                color: '#1565c0',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {infoMessage}
              </div>
            )}
            <div className="edit-fields">
              {fields.map((field) => {
                if (field.key === 'id') return null; // Não renderiza campo ID
                
                // Esconde horaDevolucao se isDevolvido não estiver marcado
                if (field.key === 'horaDevolucao' && !formData['isDevolvido' as keyof Omit<T, 'id'>]) {
                  return null;
                }
                
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
          </form>
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
              form={formIdRef.current}
              className="action-btn action-btn--primary"
            >
              Criar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}