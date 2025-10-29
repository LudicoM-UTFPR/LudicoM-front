import React, { useState, useEffect } from 'react';
import { GenericTable, DetailModal, EditModal } from '../';
import { jogoDetailFields, jogoEditFields, JOGO_COLUMNS } from '../../shared/constants';
import { useCrudOperations } from '../../shared/hooks';
import type { Jogo, TableAction } from '../../shared/types';

interface ConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
  jogos: Jogo[];
  loading?: boolean;
  error?: string | null;
  onJogoUpdated?: (jogo: Jogo) => void;
  onJogoDeleted?: (jogoId: number | string) => void;
}

export function ConsultModal({ 
  isOpen, 
  onClose, 
  jogos, 
  loading = false, 
  error = null, 
  onJogoUpdated, 
  onJogoDeleted 
}: ConsultModalProps) {
  const [localJogos, setLocalJogos] = useState<Jogo[]>(jogos);

  const { 
    selectedItem: selectedJogo, 
    isModalOpen: isDetailModalOpen, 
    handleDetalhes: openDetailModal, 
    closeDetailModal,
    handleEditar,
    isEditModalOpen,
    closeEditModal,
    createHandleExcluir,
    createHandleSalvarEdicao
  } = useCrudOperations<Jogo>();

  // Sincronizar jogos locais com a prop
  useEffect(() => {
    setLocalJogos(jogos);
  }, [jogos]);

  // Handler para exclusão
  const handleExcluir = createHandleExcluir(
    localJogos,
    (updatedJogos) => {
      setLocalJogos(updatedJogos);
      // Se há callback para notificar o componente pai, encontra qual item foi removido
      if (onJogoDeleted) {
        const removedJogo = localJogos.find(jogo => !updatedJogos.find(uj => uj.id === jogo.id));
        if (removedJogo) {
          onJogoDeleted(removedJogo.id);
        }
      }
    },
    (jogo) => `Tem certeza que deseja excluir o jogo?\n\nNome: ${jogo.nome}\nCódigo: ${jogo.codigoDeBarras}`
  );

  // Handler para salvar edição
  const handleSalvarEdicao = createHandleSalvarEdicao(
    localJogos,
    (updatedJogos) => {
      setLocalJogos(updatedJogos);
      // Notifica o componente pai sobre a atualização se callback fornecido
      if (onJogoUpdated && selectedJogo) {
        const updatedJogo = updatedJogos.find(j => j.id === selectedJogo.id);
        if (updatedJogo) {
          onJogoUpdated(updatedJogo);
        }
      }
    },
    (jogo) => ({ ...jogo, atualizadoQuando: new Date().toISOString() })
  );

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const actions: TableAction<Jogo>[] = [
    { label: 'Detalhes', onClick: openDetailModal, variant: 'primary' },
    { label: 'Editar', onClick: handleEditar, variant: 'secondary' },
    { label: 'Excluir', onClick: handleExcluir, variant: 'danger' }
  ];

  return (
    <>
      <div className="modal-backdrop" onClick={handleBackdropClick}>
        <div className="modal modal--edit" 
            style={{
                maxWidth: '90vw', 
                maxHeight: '90vh'
            }}
        >
          <div className="modal-header">
            <h2>Consultar Jogos</h2>
            <button 
              className="close-button" 
              onClick={onClose}
              type="button"
              aria-label="Fechar modal"
            >
              ✕
            </button>
          </div>
          
          <div className="modal-content" style={{ padding: '12px' }}>
            {loading && <p>Carregando jogos...</p>}
            {error && <p>Erro: {error}</p>}
            {!loading && !error && (
              <GenericTable<Jogo>
                data={localJogos}
                columns={JOGO_COLUMNS}
                actions={actions}
                searchPlaceholder="Buscar por jogo..."
                searchFields={['nome', 'nomeAlternativo', 'codigoDeBarras']}
                tableTitle="Jogos Disponíveis"
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal de detalhes do jogo selecionado */}
      <DetailModal<Jogo>
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        item={selectedJogo}
        fields={jogoDetailFields}
        title="Detalhes do Jogo"
      />

      {/* Modal de edição do jogo selecionado */}
      <EditModal<Jogo>
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleSalvarEdicao}
        item={selectedJogo}
        fields={jogoEditFields}
        title="Editar Jogo"
      />
    </>
  );
}