import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { useToast } from '../components/common';
import { eventoDetailFields, eventoEditFields, eventoCreateFields, EVENTO_COLUMNS } from '../shared/constants';
import { useCrudOperations, useEventos, useInstituicoes } from '../shared/hooks';
import { handleError, ensureHHMMSS } from '../shared/utils';
import type { Evento, TableAction } from '../shared/types';
import type { CreateField } from '../components/modals/CreateModal';
import type { EditField } from '../components/modals/EditModal';

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
    console.log(evento);
    if (!window.confirm(`Tem certeza que deseja excluir o evento?\n\nData: ${evento.data}\nInstituição: ${evento.instituicao}`)) return;
    try {
      if (deleteEvento) {
        await deleteEvento(String(evento.id));
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
  const handleSalvarEdicao = async (eventoEditado: any) => {
    try {
      // Encontrar instituição selecionada pelo nome digitado
      const instituicaoSelecionada = instituicoes.find(inst => inst.nome === eventoEditado.instituicao);

      if (!instituicaoSelecionada) {
        showError('Instituição não encontrada. Selecione uma instituição válida.');
        return;
      }

      // Construir payload para API (usa idInstituicao e remove objeto instituicao)
      const payload = {
        idInstituicao: instituicaoSelecionada.uid,
        data: eventoEditado.data,
        horaInicio: ensureHHMMSS(eventoEditado.horaInicio),
        horaFim: ensureHHMMSS(eventoEditado.horaFim)
      };

      // Atualização otimista local (mantém objeto instituição para exibição)
      const eventoLocalAtualizado: Evento = {
        ...selectedEvento!,
        ...payload,
        instituicao: instituicaoSelecionada
      };
      localSalvarEdicao(eventoLocalAtualizado);

      if (updateEvento) {
        const atualizadoRemoto = await updateEvento(eventoLocalAtualizado.id, payload);
        // Garantir que lista mantenha objeto instituição e normalizar horário para exibição (HH:mm)
        const eventoFinal = {
          ...atualizadoRemoto,
          horaInicio: atualizadoRemoto?.horaInicio ? String(atualizadoRemoto.horaInicio).slice(0, 5) : atualizadoRemoto.horaInicio,
          horaFim: atualizadoRemoto?.horaFim ? String(atualizadoRemoto.horaFim).slice(0, 5) : atualizadoRemoto.horaFim,
          instituicao: instituicaoSelecionada
        } as Evento;
        setEventos(prev => prev.map(e => e.id === eventoFinal.id ? eventoFinal : e));
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
        // Encontra a instituição pelo nome para pegar o ID
        const instituicaoSelecionada = instituicoes.find(inst => inst.nome === novo.instituicao);

        if (!instituicaoSelecionada) {
          showError('Instituição não encontrada. Por favor, selecione uma instituição válida.');
          return;
        }

        // Transforma o payload: remove 'instituicao' e adiciona 'idInstituicao'
        const payload = {
          idInstituicao: instituicaoSelecionada.uid,
          data: novo.data,
          horaInicio: ensureHHMMSS(novo.horaInicio),
          horaFim: ensureHHMMSS(novo.horaFim)
        };

        const saved = await createEvento(payload);
        
        // Adiciona a instituição completa e normaliza horário para exibição local
        const eventoComInstituicao = {
          ...saved,
          horaInicio: saved?.horaInicio ? String(saved.horaInicio).slice(0, 5) : saved.horaInicio,
          horaFim: saved?.horaFim ? String(saved.horaFim).slice(0, 5) : saved.horaFim,
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
          type: 'autocomplete' as const,
          dataListId: 'instituicoes-list',
          options: instituicoes.map(inst => ({
            value: inst.nome,
            label: inst.nome
          }))
        };
      }
      return field;
    });
  }, [instituicoes]);

  // Campos de edição com lista de instituições
  const eventoEditFieldsWithOptions: EditField<Evento>[] = useMemo(() => {
    return eventoEditFields.map(field => {
      if (field.key === 'instituicao') {
        return {
          ...field,
          type: 'autocomplete' as const,
          dataListId: 'instituicoes-list-edit',
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
        fields={eventoEditFieldsWithOptions}
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