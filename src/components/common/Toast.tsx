import React, { useEffect } from 'react';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  id, 
  message, 
  type = 'info', 
  duration = 5000,
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div className={`toast toast--${type}`}>
      <div className="toast-content">
        <span className="toast-icon">
          {type === 'error' && '❌'}
          {type === 'success' && '✅'}
          {type === 'warning' && '⚠️'}
          {type === 'info' && 'ℹ️'}
        </span>
        <span className="toast-message">{message}</span>
      </div>
      <button 
        className="toast-close" 
        onClick={() => onClose(id)}
        aria-label="Fechar notificação"
      >
        ✕
      </button>
    </div>
  );
};
