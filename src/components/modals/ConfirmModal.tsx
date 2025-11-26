import React from 'react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  variant?: 'danger' | 'primary' | 'default';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Confirmar Ação',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'danger',
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const confirmBtnClass = variant === 'danger'
    ? 'btn btn--medium btn--danger'
    : variant === 'primary'
      ? 'btn btn--medium btn--primary'
      : 'btn btn--medium btn--default';

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            className="close-button"
            onClick={onCancel}
            type="button"
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>
        <div className="modal-content">
          <div className="confirm-message">
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>
        </div>
        <div className="modal-footer">
          <div className="acoes-grupo">
            <button
              type="button"
              className="btn btn--medium btn--ghost"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={confirmBtnClass}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
