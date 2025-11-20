import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { useToast } from '../components/common';
import { eventoDetailFields, eventoEditFields, eventoCreateFields, EVENTO_COLUMNS } from '../shared/constants';
import { useCrudOperations, useEventos, useInstituicoes } from '../shared/hooks';
import { handleError } from '../shared/utils';
import type { Evento, TableAction } from '../shared/types';
import type { CreateField } from '../components/modals/CreateModal';

const Eventos: React.FC = () => {
  const { eventos: remoteEventos, loading, error, createEvento, updateEvento, deleteEvento } = useEventos();
  const { instituicoes } = useInstituicoes();
  const { showErrorList, showError, showSuccess } = useToast();
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
        showSuccess('Evento excluído com sucesso!');
      } else {
        baseHandleExcluir(evento);
      }
    } catch (e: any) {
      handleError(e, 'Eventos - delete');
      if (e?.errors) {
        showErrorList(e.errors);
      } else {
        showError(e?.message || 'Erro ao excluir evento');
      }
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
        showSuccess('Evento atualizado com sucesso!');
      }
    } catch (e: any) {
      handleError(e, 'Eventos - update');
      if (e?.errors) {
        showErrorList(e.errors);
      } else {
        showError(e?.message || 'Erro ao atualizar evento');
      }
    }
  };

  const localSalvarCriacao = createHandleSalvarCriacao(eventos, setEventos);
  const handleSalvarCriacao = async (novo: any) => {
    try {
      if (createEvento) {
        console.log('Dados recebidos do formulário:', novo); // Debug
        console.log('Lista de instituições:', instituicoes); // Debug
        
        // Encontra a instituição pelo nome para pegar o ID
        const instituicaoSelecionada = instituicoes.find(inst => inst.nome === novo.instituicao);
        
        console.log('Instituição selecionada:', instituicaoSelecionada); // Debug
        
        if (!instituicaoSelecionada) {
          showError('Instituição não encontrada. Por favor, selecione uma instituição válida.');
          return;
        }

        // Transforma o payload: remove 'instituicao' e adiciona 'idInstituicao'
        const payload = {
          idInstituicao: instituicaoSelecionada.uid,
          data: novo.data,
          horaInicio: novo.horaInicio,
          horaFim: novo.horaFim
        };

        console.log('Payload enviado:', payload); // Debug

        const saved = await createEvento(payload);
        
        // Adiciona a instituição completa ao evento para exibição local
        const eventoComInstituicao = {
          ...saved,
          instituicao: instituicaoSelecionada
        };
        
        setEventos(prev => [...prev, eventoComInstituicao]);
        showSuccess('Evento criado com sucesso!');
      } else {
        localSalvarCriacao(novo);
      }
    } catch (e: any) {
      handleError(e, 'Eventos - create');
      if (e?.errors) {
        showErrorList(e.errors);
      } else {
        showError(e?.message || 'Erro ao criar evento');
      }
      // Não faz fallback local em caso de erro de validação
    }
  };

  const actions: TableAction<Evento>[] = [
    { label: 'Detalhes', onClick: handleDetalhes, variant: 'primary' },
    { label: 'Editar', onClick: handleEditar, variant: 'secondary' },
    { label: 'Excluir', onClick: handleExcluir, variant: 'danger' }
  ];

  // Campos de criação com lista de instituições
  const eventoCreateFieldsWithOptions: CreateField<Evento>[] = useMemo(() => {
    return eventoCreateFields.map(field => {
      if (field.key === 'instituicao') {
        return {
          ...field,
          type: 'select' as const,
          options: instituicoes.map(inst => ({
            value: inst.nome,
            label: inst.nome
          }))
        };
      }
      return field;
    });
  }, [instituicoes]);

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
        fields={eventoCreateFieldsWithOptions}
        title="Criar Novo Evento"
      />
    </div>
  );
};

export default Eventos;