import React, { useState, useEffect } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { eventoDetailFields, eventoEditFields, eventoCreateFields, EVENTO_COLUMNS } from '../shared/constants';
import { useCrudOperations, useEventos } from '../shared/hooks';
import { handleError } from '../shared/utils';
import type { Evento, TableAction } from '../shared/types';

const Eventos: React.FC = () => {
  const { eventos: remoteEventos, loading, error, createEvento, updateEvento, deleteEvento } = useEventos();
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
    if (remoteEventos.length > 0) {
      setEventos(remoteEventos);
    }
  }, [remoteEventos]);

  // Handlers personalizados usando os factories do hook
  const baseHandleExcluir = createHandleExcluir(
    eventos,
    setEventos,
    (evento: Evento) => `Tem certeza que deseja excluir o evento?\n\nData: ${evento.data}\nInstituição: ${evento.instituicao}`
  );

  const handleExcluir = async (evento: Evento) => {
    if (!window.confirm(`Tem certeza que deseja excluir o evento?\n\nData: ${evento.data}\nInstituição: ${evento.instituicao}`)) return;
    try {
      if (deleteEvento) {
        await deleteEvento(evento.id);
        setEventos(prev => prev.filter(e => e.id !== evento.id));
      } else {
        baseHandleExcluir(evento);
      }
    } catch (e) {
      handleError(e, 'Eventos - delete');
      baseHandleExcluir(evento); // fallback local
    }
  };

  const localSalvarEdicao = createHandleSalvarEdicao(eventos, setEventos);
  const handleSalvarEdicao = async (eventoAtualizado: Evento) => {
    // Otimista
    localSalvarEdicao(eventoAtualizado);
    try {
      if (updateEvento) {
        await updateEvento(eventoAtualizado.id, eventoAtualizado);
      }
    } catch (e) {
      handleError(e, 'Eventos - update');
    }
  };

  const localSalvarCriacao = createHandleSalvarCriacao(eventos, setEventos);
  const handleSalvarCriacao = async (novo: any) => {
    try {
      if (createEvento) {
        const saved = await createEvento(novo);
        setEventos(prev => [...prev, saved]);
      } else {
        localSalvarCriacao(novo);
      }
    } catch (e) {
      handleError(e, 'Eventos - create');
      localSalvarCriacao(novo); // fallback
    }
  };

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
      {loading && <p>Carregando eventos...</p>}
      {error && <p className="error">{error}</p>}
      
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