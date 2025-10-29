import React, { useState, useEffect } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { participanteDetailFields, participanteEditFields, participanteCreateFields, PARTICIPANTE_COLUMNS } from '../shared/constants';
import { useCrudOperations, useParticipantes } from '../shared/hooks';
import type { Participante, TableAction } from '../shared/types';

const Participantes: React.FC = () => {
  // Hook para gerenciamento de dados
  const { participantes, loading, error, createParticipante, updateParticipante, deleteParticipante } = useParticipantes();
  const [localParticipantes, setLocalParticipantes] = useState<Participante[]>([]);
  
  // Hook personalizado para operações CRUD
  const {
    selectedItem: selectedParticipante,
    isModalOpen,
    isEditModalOpen,
    isCreateModalOpen,
    handleDetalhes,
    handleEditar,
    handleCriar: handleAdicionarParticipante,
    createHandleExcluir,
    createHandleSalvarEdicao,
    createHandleSalvarCriacao,
    closeDetailModal,
    closeEditModal,
    closeCreateModal
  } = useCrudOperations<Participante>();

  // Sincroniza dados do hook com estado local para operações CRUD
  useEffect(() => {
    if (participantes.length > 0) {
      setLocalParticipantes(participantes);
    }
  }, [participantes]);

  // Handlers criados usando as factories do hook
  const handleExcluir = createHandleExcluir(
    localParticipantes,
    setLocalParticipantes,
    (participante) => `Tem certeza que deseja excluir o participante?\n\nNome: ${participante.nome}\nRA: ${participante.ra}`
  );

  const handleSalvarEdicao = createHandleSalvarEdicao(
    localParticipantes,
    setLocalParticipantes
  );

  const handleSalvarCriacao = createHandleSalvarCriacao(
    localParticipantes,
    setLocalParticipantes
  );



  const actions: TableAction<Participante>[] = [
    { label: 'Detalhes', onClick: handleDetalhes, variant: 'primary' },
    { label: 'Editar', onClick: handleEditar, variant: 'secondary' },
    { label: 'Excluir', onClick: handleExcluir, variant: 'danger' }
  ];

  return (
    <div className="page-container">
      <PageHeader 
        title="Gerenciamento de Participantes"
        buttonText="Adicionar Participante"
        onButtonClick={handleAdicionarParticipante}
      />
      <GenericTable<Participante>
        data={localParticipantes}
        columns={PARTICIPANTE_COLUMNS}
        actions={actions}
        searchPlaceholder="Buscar por participante..."
        searchFields={['nome', 'email', 'documento', 'ra']}
        tableTitle="Participantes Cadastrados"
      />
      
      <DetailModal<Participante>
        isOpen={isModalOpen}
        onClose={closeDetailModal}
        item={selectedParticipante}
        fields={participanteDetailFields}
        title="Detalhes do Participante"
        onEdit={handleEditar}
        onDelete={handleExcluir}
      />

      <EditModal<Participante>
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleSalvarEdicao}
        item={selectedParticipante}
        fields={participanteEditFields}
        title="Editar Participante"
      />

      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSave={handleSalvarCriacao}
        fields={participanteCreateFields}
        title="Criar Novo Participante"
      />
    </div>
  );
};

export default Participantes;