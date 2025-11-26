import React from 'react';

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  message = "Nenhum dado encontrado.",
  icon
}) => {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state__icon">{icon}</div>}
      <p className="empty-state__message">{message}</p>
    </div>
  );
};

export default EmptyState;
