import React, { useState, useMemo, useCallback } from 'react';
import { SearchIcon } from '../icons';
import { EmptyState } from '../common';
import { filterByMultipleFields, escapeHtml, handleError } from '../../shared/utils';
import { TableColumn, TableAction } from '../../shared/types';

interface GenericTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  searchPlaceholder?: string;
  searchFields: (keyof T)[];
  tableTitle: string;
  emptyMessage?: string;
}

const GenericTable = <T extends { id: number | string }>({
  data,
  columns,
  actions = [],
  searchPlaceholder = "Buscar...",
  searchFields,
  tableTitle,
  emptyMessage = "Nenhum dado encontrado."
}: GenericTableProps<T>): React.ReactElement => {
  const [filtro, setFiltro] = useState<string>('');

  // Memoiza os dados filtrados para evitar recálculos desnecessários
  const dadosFiltrados = useMemo((): T[] => {
    try {
      if (!filtro.trim()) return data;
      return filterByMultipleFields(data, filtro, searchFields);
    } catch (error) {
      handleError(error, 'GenericTable - Filter');
      return data;
    }
  }, [data, filtro, searchFields]);

  const handleFiltroChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setFiltro(e.target.value);
  }, []);

  const handleBuscaClick = useCallback((): void => {
    // Função já é executada automaticamente pelo useMemo
    // Mantida para compatibilidade com o botão
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleBuscaClick();
    }
  }, [handleBuscaClick]);

  const renderCellContent = useCallback((column: TableColumn<T>, item: T, needsTextLimit: boolean = false): React.ReactNode => {
    try {
      const value = item[column.key];
      
      if (column.render) {
        return column.render(value, item);
      }
      
      // Renderização padrão com escape HTML para segurança
      const stringValue = String(value || '');
      const content = escapeHtml(stringValue);
      
      // Aplica limitação de texto apenas quando necessário
      if (needsTextLimit) {
        return <span className="tabela-cell-content">{content}</span>;
      }
      
      return content;
    } catch (error) {
      handleError(error, 'GenericTable - RenderCell');
      return '';
    }
  }, []);

  const getActionButtonClass = useCallback((variant?: string): string => {
    switch (variant) {
      case 'danger':
        return 'btn btn--small btn--danger';
      case 'secondary':
        return 'btn btn--small btn--tertiary'; 
      case 'primary':
      default:
        return 'btn btn--small btn--secondary';
    }
  }, []);

  return (
    <section className="tabela-emprestimo">
      {/* Campo de Busca */}
      <div className="busca-container">
        <input
          type="text"
          className="busca-input"
          placeholder={searchPlaceholder}
          value={filtro}
          onChange={handleFiltroChange}
          onKeyPress={handleKeyPress}
        />
        <button className="busca-btn" onClick={handleBuscaClick}>
          <SearchIcon />
        </button>
      </div>

      {/* Tabela */}
      {dadosFiltrados.length === 0 ? (
        <EmptyState 
          message={filtro.trim() ? "Nenhum resultado encontrado para sua busca." : emptyMessage}
        />
      ) : (
        <div className="tabela-wrapper">
          <table className="tabela">
            <caption className="tabela-titulo">
              {tableTitle}
            </caption>
            <thead className="tabela-head">
              <tr className="tabela-header-row">
                {columns.map((column) => (
                  <th key={String(column.key)} className="tabela-header">
                    {column.label}
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className="tabela-header">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="tabela-body">
              {dadosFiltrados.map((item) => (
                <tr
                  key={item.id}
                  className="tabela-row"
                  data-id={item.id}
                >
                  {columns.map((column, columnIndex) => (
                    <td
                      key={String(column.key)}
                      className="tabela-cell"
                      title={String(item[column.key] || '')}
                    >
                      {renderCellContent(column, item, columnIndex < 4)}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="tabela-cell">
                      <div className="acoes-grupo">
                        {actions.map((action, index) => (
                          <button
                            key={index}
                            className={getActionButtonClass(action.variant)}
                            onClick={() => {
                              try {
                                action.onClick(item);
                              } catch (error) {
                                handleError(error, 'GenericTable - ActionClick');
                              }
                            }}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default GenericTable;