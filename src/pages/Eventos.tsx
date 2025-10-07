import React, { useState, useEffect } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { eventoDetailFields, eventoEditFields, eventoCreateFields, EVENTO_COLUMNS } from '../shared/constants';
import { useCrudOperations } from '../shared/hooks';
import eventosData from '../shared/data/eventos.json';
import { handleError } from '../shared/utils';
import type { Evento, TableAction } from '../shared/types';

const Eventos: React.FC = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  
  // Hook personalizado para operações CRUD
  const {
    selectedItem: selectedEvento,
    isModalOpen,
    isEditModalOpen,
    isCreateModalOpen,
    handleDetalhes,
    handleEditar,
    handleCriar,
    createHandleExcluir,
    createHandleSalvarEdicao,
    createHandleSalvarCriacao,
    closeDetailModal,
    closeEditModal,
    closeCreateModal
  } = useCrudOperations<Evento>();

  useEffect(() => {
    try {
      // Validação e carregamento dos dados
      const validatedData = eventosData.map((item): Evento => ({
        id: Number(item.id),
        data: String(item.data || ""),
        instituicao: String(item.instituicao || ""),
        horarioEvento: String(item.horarioEvento || "")
      }));
      setEventos(validatedData);
    } catch (error) {
      handleError(error, "Eventos - Data Loading");
    }
  }, []);

  // Handlers personalizados usando os factories do hook
  const handleExcluir = createHandleExcluir(
    eventos,
    setEventos,
    (evento: Evento) => `Tem certeza que deseja excluir o evento?\n\nData: ${evento.data}\nInstituição: ${evento.instituicao}`
  );

  const handleSalvarEdicao = createHandleSalvarEdicao(
    eventos,
    setEventos
  );

  const handleSalvarCriacao = createHandleSalvarCriacao(
    eventos,
    setEventos
  );

  const actions: TableAction<Evento>[] = [
    { label: 'Detalhes', onClick: handleDetalhes, variant: 'primary' },
    { label: 'Editar', onClick: handleEditar, variant: 'secondary' },
    { label: 'Excluir', onClick: handleExcluir, variant: 'danger' }
  ];

  return (
    <div className="page-container">
      <PageHeader 
        title="Gerenciamento de Eventos"
        buttonText="Criar Evento"
        onButtonClick={handleCriar}
      />
      <GenericTable<Evento>
        data={eventos}
        columns={EVENTO_COLUMNS}
        actions={actions}
        searchPlaceholder="Buscar por evento..."
        searchFields={['data', 'instituicao']}
        tableTitle="Eventos Cadastrados"
      />
      
      <DetailModal<Evento>
        isOpen={isModalOpen}
        onClose={closeDetailModal}
        item={selectedEvento}
        fields={eventoDetailFields}
        title="Detalhes do Evento"
        onEdit={handleEditar}
        onDelete={handleExcluir}
      />

      <EditModal<Evento>
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleSalvarEdicao}
        item={selectedEvento}
        fields={eventoEditFields}
        title="Editar Evento"
      />

      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSave={handleSalvarCriacao}
        fields={eventoCreateFields}
        title="Criar Novo Evento"
      />
    </div>
  );
};

export default Eventos;