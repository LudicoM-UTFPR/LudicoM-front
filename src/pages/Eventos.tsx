import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { useToast } from '../components/common';
import { eventoDetailFields, eventoEditFields, eventoCreateFields, EVENTO_COLUMNS } from '../shared/constants';
import { instituicaoCreateFields } from '../shared/constants/createFields';
import { useCrudOperations, useEventos, useInstituicoes } from '../shared/hooks';
import { handleError, ensureHHMMSS } from '../shared/utils';
import type { Evento, TableAction } from '../shared/types';
import type { CreateField } from '../components/modals/CreateModal';
import type { EditField } from '../components/modals/EditModal';

const Eventos: React.FC = () => {
  const { eventos: remoteEventos, loading, error, createEvento, updateEvento, deleteEvento } = useEventos();
  const { instituicoes, createInstituicao } = useInstituicoes();
  const { showErrorList, showError, showSuccess, showWarning } = useToast();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Evento | null>(null);
  const [showCreateInstituicao, setShowCreateInstituicao] = useState(false);
  const [newInstituicaoNamePrefill, setNewInstituicaoNamePrefill] = useState<string>('');
  
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
  const askExcluir = (evento: Evento) => {
    setToDelete(evento);
    setConfirmOpen(true);
  };

  const confirmExcluir = async () => {
    if (!toDelete) return;
    try {
      if (deleteEvento) {
        await deleteEvento(String(toDelete.id));
        setEventos(prev => prev.filter(e => e.id !== toDelete.id));
        showSuccess('Evento excluído com sucesso!');
      }
    } catch (e: any) {
      handleError(e, 'Eventos - delete');
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showWarning(e?.message || 'Conflito: não é possível excluir evento.');
      } else if (e?.errors) {
        showErrorList(e.errors);
      } else {
        showError(e?.message || 'Erro ao excluir evento');
      }
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

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

      if (updateEvento) {
        const atualizadoRemoto = await updateEvento(selectedEvento!.id, payload);
        // Garantir que lista mantenha objeto instituição e normalizar horário para exibição (HH:mm)
        const eventoFinal = {
          ...atualizadoRemoto,
          horaInicio: atualizadoRemoto?.horaInicio ? String(atualizadoRemoto.horaInicio).slice(0, 5) : atualizadoRemoto.horaInicio,
          horaFim: atualizadoRemoto?.horaFim ? String(atualizadoRemoto.horaFim).slice(0, 5) : atualizadoRemoto.horaFim,
          instituicao: instituicaoSelecionada
        } as Evento;
        setEventos(prev => prev.map(e => e.id === eventoFinal.id ? eventoFinal : e));
        showSuccess('Evento atualizado com sucesso!');
        closeEditModal(); // Fecha apenas em caso de sucesso
      }
    } catch (e: any) {
      handleError(e, 'Eventos - update');
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showWarning(e?.message || 'Conflito ao atualizar evento.');
      } else if (e?.errors) {
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
        closeCreateModal(); // Fecha apenas em caso de sucesso
      } else {
        localSalvarCriacao(novo);
        closeCreateModal(); // Fecha também para fallback local
      }
    } catch (e: any) {
      handleError(e, 'Eventos - create');
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showWarning(e?.message || 'Conflito ao criar evento.');
      } else if (e?.errors) {
        showErrorList(e.errors);
      } else {
        showError(e?.message || 'Erro ao criar evento');
      }
      // Não faz fallback local em caso de erro de validação
    }
  };

  // Criação inline de instituição a partir do modal de evento (fora da função de criar evento)
  const handleSalvarNovaInstituicao = async (nova: any) => {
    if (!createInstituicao) return;
    try {
      const saved = await createInstituicao({ nome: nova.nome, endereco: nova.endereco || '' });
      setShowCreateInstituicao(false);
      setNewInstituicaoNamePrefill(saved.nome);
      showSuccess('Instituição criada com sucesso!');
    } catch (e: any) {
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showWarning(e?.message || 'Conflito ao criar instituição.');
      } else if (e?.errors) {
        showErrorList(e.errors);
      } else {
        showError(e?.message || 'Erro ao criar instituição.');
      }
    }
  };

  const actions: TableAction<Evento>[] = [
    { label: 'Detalhes', onClick: handleDetalhes, variant: 'primary' },
    { label: 'Editar', onClick: handleEditar, variant: 'secondary' },
    { label: 'Excluir', onClick: askExcluir, variant: 'danger' }
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
        showButton={false}
      />
      <section style={{ marginBottom: '24px', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div className="acoes-buttons">
          <button
            type="button"
            className="btn btn--xlarge"
            onClick={handleCriar}
          >
            Criar Evento
          </button>
        </div>
      </section>
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
        onDelete={askExcluir}
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
        inlineFieldActions={{
          instituicao: {
            label: '+',
            title: 'Criar nova instituição',
            onClick: () => setShowCreateInstituicao(true)
          }
        }}
        prefill={newInstituicaoNamePrefill ? { instituicao: newInstituicaoNamePrefill } as any : undefined}
        title="Criar Novo Evento"
      />
      <CreateModal
        isOpen={showCreateInstituicao}
        onClose={() => setShowCreateInstituicao(false)}
        onSave={handleSalvarNovaInstituicao as any}
        fields={instituicaoCreateFields as any}
        title="Criar Instituição"
      />
      <ConfirmModal
        isOpen={confirmOpen}
        title="Excluir Evento"
        message={
          toDelete ? (
            <>
              Tem certeza que deseja excluir o evento?<br />
              <strong>Data:</strong> {toDelete.data}<br />
              <strong>Instituição:</strong> {toDelete?.instituicao?.nome}
            </>
          ) : 'Tem certeza que deseja excluir o evento?'
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmExcluir}
        onCancel={() => { setConfirmOpen(false); setToDelete(null); }}
      />
    </div>
  );
};

export default Eventos;