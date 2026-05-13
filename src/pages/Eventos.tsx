import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal, Pagination } from '../components';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { useToast } from '../components/common';
import { eventoDetailFields, eventoEditFields, eventoCreateFields, EVENTO_COLUMNS } from '../shared/constants';
import { instituicaoCreateFields } from '../shared/constants/createFields';
import { useCrudOperations, useInstituicoes as useInstituicoesHook } from '../shared/hooks';
import { fetchEventosPaginated, createEvento, updateEvento, deleteEvento } from '../shared/services/eventosService';
import { handleError, ensureHHMMSS } from '../shared/utils';
import type { Evento, TableAction } from '../shared/types';
import type { CreateField } from '../components/modals/CreateModal';
import type { EditField } from '../components/modals/EditModal';

const Eventos: React.FC = () => {
  const { instituicoes, createInstituicao } = useInstituicoesHook();
  const { showErrorList, showError, showSuccess, showWarning } = useToast();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Evento | null>(null);
  const [showCreateInstituicao, setShowCreateInstituicao] = useState(false);
  const [newInstituicaoNamePrefill, setNewInstituicaoNamePrefill] = useState<string>('');

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    selectedItem: selectedEvento,
    isModalOpen,
    isEditModalOpen,
    isCreateModalOpen,
    handleDetalhes,
    handleEditar,
    handleCriar,
    closeDetailModal,
    closeEditModal,
    closeCreateModal
  } = useCrudOperations<Evento>();

  const fetchPage = useCallback(async (p: number, search: string, size: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchEventosPaginated(p, size, search || undefined);
      setEventos(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      setPage(result.number);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError('Erro ao carregar eventos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchText);
      if (searchText !== debouncedSearch) setPage(0);
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchText]);

  useEffect(() => {
    fetchPage(page, debouncedSearch, pageSize);
  }, [page, debouncedSearch, pageSize, fetchPage]);

  const handleSearchChange = useCallback((value: string) => setSearchText(value), []);
  const handlePageSizeChange = useCallback((size: number) => { setPageSize(size); setPage(0); }, []);

  const refetchCurrentPage = useCallback(() => {
    fetchPage(page, debouncedSearch, pageSize);
  }, [page, debouncedSearch, pageSize, fetchPage]);

  const askExcluir = (evento: Evento) => {
    setToDelete(evento);
    setConfirmOpen(true);
  };

  const confirmExcluir = async () => {
    if (!toDelete) return;
    try {
      await deleteEvento(String(toDelete.id));
      showSuccess('Evento excluído com sucesso!');
      refetchCurrentPage();
    } catch (e: any) {
      handleError(e, 'Eventos - delete');
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showWarning(e?.message || 'Conflito: não é possível excluir evento.');
      } else if (e?.errors) { showErrorList(e.errors); } else { showError(e?.message || 'Erro ao excluir evento'); }
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const handleSalvarEdicao = async (eventoEditado: any) => {
    try {
      const instituicaoSelecionada = instituicoes.find(inst => inst.nome === eventoEditado.instituicao);
      if (!instituicaoSelecionada) { showError('Instituição não encontrada. Selecione uma instituição válida.'); return; }
      const payload = { idInstituicao: instituicaoSelecionada.uid, data: eventoEditado.data, horaInicio: ensureHHMMSS(eventoEditado.horaInicio), horaFim: ensureHHMMSS(eventoEditado.horaFim) };
      const atualizadoRemoto = await updateEvento(selectedEvento!.id, payload);
      const eventoFinal = { ...atualizadoRemoto, horaInicio: String(atualizadoRemoto?.horaInicio || '').slice(0, 5), horaFim: String(atualizadoRemoto?.horaFim || '').slice(0, 5), instituicao: instituicaoSelecionada } as Evento;
      setEventos(prev => prev.map(e => e.id === eventoFinal.id ? eventoFinal : e));
      showSuccess('Evento atualizado com sucesso!');
      closeEditModal();
      refetchCurrentPage();
    } catch (e: any) {
      handleError(e, 'Eventos - update');
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showWarning(e?.message || 'Conflito ao atualizar evento.');
      } else if (e?.errors) { showErrorList(e.errors); } else { showError(e?.message || 'Erro ao atualizar evento'); }
    }
  };

  const handleSalvarCriacao = async (novo: any) => {
    try {
      const instituicaoSelecionada = instituicoes.find(inst => inst.nome === novo.instituicao);
      if (!instituicaoSelecionada) { showError('Instituição não encontrada. Por favor, selecione uma instituição válida.'); return; }
      const payload = { idInstituicao: instituicaoSelecionada.uid, data: novo.data, horaInicio: ensureHHMMSS(novo.horaInicio), horaFim: ensureHHMMSS(novo.horaFim) };
      await createEvento(payload);
      showSuccess('Evento criado com sucesso!');
      closeCreateModal();
      setPage(0);
      setDebouncedSearch('');
      setSearchText('');
    } catch (e: any) {
      handleError(e, 'Eventos - create');
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showWarning(e?.message || 'Conflito ao criar evento.');
      } else if (e?.errors) { showErrorList(e.errors); } else { showError(e?.message || 'Erro ao criar evento'); }
    }
  };

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
      } else if (e?.errors) { showErrorList(e.errors); } else { showError(e?.message || 'Erro ao criar instituição.'); }
    }
  };

  const actions: TableAction<Evento>[] = [
    { label: 'Detalhes', onClick: handleDetalhes, variant: 'primary' },
    { label: 'Editar', onClick: handleEditar, variant: 'secondary' },
    { label: 'Excluir', onClick: askExcluir, variant: 'danger' }
  ];

  const eventoCreateFieldsWithOptions: CreateField<Evento>[] = useMemo(() => {
    return eventoCreateFields.map(field => {
      if (field.key === 'instituicao') {
        return { ...field, type: 'autocomplete' as const, dataListId: 'instituicoes-list', options: instituicoes.map(inst => ({ value: inst.nome, label: inst.nome })) };
      }
      return field;
    });
  }, [instituicoes]);

  const eventoEditFieldsWithOptions: EditField<Evento>[] = useMemo(() => {
    return eventoEditFields.map(field => {
      if (field.key === 'instituicao') {
        return { ...field, type: 'autocomplete' as const, dataListId: 'instituicoes-list-edit', options: instituicoes.map(inst => ({ value: inst.nome, label: inst.nome })) };
      }
      return field;
    });
  }, [instituicoes]);

  return (
    <div className="page-container">
      <PageHeader title="Gerenciamento de Eventos" showButton={false} />
      <section style={{ marginBottom: '24px', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div className="acoes-buttons">
          <button type="button" className="btn btn--xlarge" onClick={handleCriar}>Criar Evento</button>
        </div>
      </section>

      {loading && eventos.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Carregando...</div>}
      {error && eventos.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--btn-danger)' }}>{error}</div>}
      {(eventos.length > 0 || !loading) && (
        <div style={{ opacity: loading && eventos.length > 0 ? 0.5 : 1, transition: 'opacity 0.15s ease' }}>
          <GenericTable<Evento>
            data={eventos}
            columns={EVENTO_COLUMNS}
            actions={actions}
            searchPlaceholder="Buscar por evento..."
            searchFields={['data', 'instituicao']}
            tableTitle="Eventos Cadastrados"
            emptyMessage="Nenhum evento encontrado."
            controlledSearchValue={searchText}
            onControlledSearchChange={handleSearchChange}
          />
          <Pagination
            page={page} totalPages={totalPages} totalElements={totalElements}
            pageSize={pageSize} onPageChange={setPage} onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}

      <DetailModal<Evento>
        isOpen={isModalOpen} onClose={closeDetailModal} item={selectedEvento}
        fields={eventoDetailFields} title="Detalhes do Evento" onEdit={handleEditar} onDelete={askExcluir}
      />
      <EditModal<Evento>
        isOpen={isEditModalOpen} onClose={closeEditModal} onSave={handleSalvarEdicao}
        item={selectedEvento} fields={eventoEditFieldsWithOptions} title="Editar Evento"
      />
      <CreateModal
        isOpen={isCreateModalOpen} onClose={closeCreateModal} onSave={handleSalvarCriacao}
        fields={eventoCreateFieldsWithOptions}
        inlineFieldActions={{ instituicao: { label: '+', title: 'Criar nova instituição', onClick: () => setShowCreateInstituicao(true) } }}
        prefill={newInstituicaoNamePrefill ? { instituicao: newInstituicaoNamePrefill } as any : undefined}
        title="Criar Novo Evento"
      />
      <CreateModal
        isOpen={showCreateInstituicao} onClose={() => setShowCreateInstituicao(false)}
        onSave={handleSalvarNovaInstituicao as any} fields={instituicaoCreateFields as any} title="Criar Instituição"
      />
      <ConfirmModal
        isOpen={confirmOpen} title="Excluir Evento"
        message={toDelete ? (<>
          Tem certeza que deseja excluir o evento?<br />
          <strong>Data:</strong> {toDelete.data}<br />
          <strong>Instituição:</strong> {toDelete?.instituicao?.nome}
        </>) : 'Tem certeza que deseja excluir o evento?'}
        confirmLabel="Excluir" cancelLabel="Cancelar" variant="danger"
        onConfirm={confirmExcluir}
        onCancel={() => { setConfirmOpen(false); setToDelete(null); }}
      />
    </div>
  );
};

export default Eventos;
