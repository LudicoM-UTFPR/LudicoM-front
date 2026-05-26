import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal, Pagination } from '../components';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { useCrudOperations, useEventos } from '../shared/hooks';
import { fetchInstituicoesPaginated, createInstituicao, updateInstituicao, deleteInstituicao } from '../shared/services/instituicaoService';
import { instituicaoDetailFields, instituicaoEditFields, instituicaoCreateFields, INSTITUICAO_COLUMNS } from '../shared/constants';
import type { Instituicao, TableAction } from '../shared/types';
import { useToast } from '../components/common';

type InstituicaoUI = Instituicao & { id: string };

const Instituicoes: React.FC = () => {
  const { eventos } = useEventos();
  const { showError, showErrorList, showSuccess, showWarning } = useToast();
  const [instituicoes, setInstituicoes] = useState<InstituicaoUI[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<InstituicaoUI | null>(null);

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
    selectedItem: selected,
    isModalOpen,
    isEditModalOpen,
    isCreateModalOpen,
    handleDetalhes,
    handleEditar,
    handleCriar,
    closeDetailModal,
    closeEditModal,
    closeCreateModal
  } = useCrudOperations<InstituicaoUI>();

  const fetchPage = useCallback(async (p: number, search: string, size: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchInstituicoesPaginated(p, size, search || undefined);
      setInstituicoes(result.content.map(i => ({ ...i, id: i.uid })));
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      setPage(result.number);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError('Erro ao carregar instituições.');
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

  const askExcluir = (item: InstituicaoUI) => {
    setToDelete(item);
    setConfirmOpen(true);
  };

  const confirmExcluir = async () => {
    if (!toDelete) return;
    const vinculados = eventos.filter(ev => ev.idInstituicao === toDelete.uid || ev.instituicao?.uid === toDelete.uid);
    if (vinculados.length > 0) {
      showWarning(`Não é possível excluir: vinculada a ${vinculados.length} evento(s).`);
      setConfirmOpen(false); setToDelete(null);
      return;
    }
    try {
      await deleteInstituicao(toDelete.uid);
      showSuccess('Instituição excluída com sucesso!');
      refetchCurrentPage();
    } catch (e: any) {
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showWarning(e?.message || 'Conflito: instituição vinculada a eventos.');
      } else if (e?.errors) { showErrorList(e.errors); } else { showError(e?.message || 'Erro ao excluir instituição.'); }
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const handleSalvarEdicao = async (edited: Partial<InstituicaoUI>) => {
    if (!selected) return;
    const errors: Record<string,string> = {};
    if (edited.nome && instituicoes.some(i => i.nome === edited.nome && i.id !== selected.id)) {
      errors.nome = 'Nome de instituição já cadastrado.';
    }
    if (Object.keys(errors).length) { showErrorList(errors); return; }
    const payload = { nome: edited.nome, endereco: edited.endereco } as Partial<Instituicao>;
    try {
      const saved = await updateInstituicao(selected.uid, payload);
      setInstituicoes(prev => prev.map(i => i.id === selected.id ? { ...saved, id: saved.uid } : i));
      showSuccess('Instituição atualizada com sucesso!');
      closeEditModal();
      refetchCurrentPage();
    } catch (e: any) {
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showWarning(e?.message || 'Conflito ao atualizar instituição.');
      } else if (e?.errors) { showErrorList(e.errors); } else { showError(e?.message || 'Erro ao atualizar instituição.'); }
    }
  };

  const handleSalvarCriacao = async (novo: Partial<Instituicao>) => {
    const errors: Record<string,string> = {};
    if (novo.nome && instituicoes.some(i => i.nome === novo.nome)) {
      errors.nome = 'Nome de instituição já cadastrado.';
    }
    if (Object.keys(errors).length) { showErrorList(errors); return; }
    try {
      await createInstituicao({ nome: novo.nome || '', endereco: novo.endereco || '' });
      showSuccess('Instituição criada com sucesso!');
      closeCreateModal();
      setPage(0);
      setDebouncedSearch('');
      setSearchText('');
    } catch (e: any) {
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showWarning(e?.message || 'Conflito ao criar instituição.');
      } else if (e?.errors) { showErrorList(e.errors); } else { showError(e?.message || 'Erro ao criar instituição.'); }
    }
  };

  const actions: TableAction<InstituicaoUI>[] = useMemo(() => ([
    { label: 'Detalhes', onClick: handleDetalhes, variant: 'primary' },
    { label: 'Editar', onClick: handleEditar, variant: 'secondary' },
    { label: 'Excluir', onClick: askExcluir, variant: 'danger' }
  ]), []);

  return (
    <div className="page-container">
      <PageHeader title="Gerenciamento de Instituições" showButton={false} />
      <section style={{ marginBottom: '24px', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div className="acoes-buttons">
          <button type="button" className="btn btn--xlarge" onClick={handleCriar}>Criar Instituição</button>
        </div>
      </section>

      {loading && instituicoes.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Carregando...</div>}
      {error && instituicoes.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--btn-danger)' }}>{error}</div>}
      {(instituicoes.length > 0 || !loading) && (
        <div style={{ opacity: loading && instituicoes.length > 0 ? 0.5 : 1, transition: 'opacity 0.15s ease' }}>
          <GenericTable<InstituicaoUI>
            data={instituicoes}
            columns={INSTITUICAO_COLUMNS as any}
            actions={actions}
            searchPlaceholder="Buscar por instituição..."
            searchFields={['nome', 'endereco'] as any}
            tableTitle="Instituições Cadastradas"
            emptyMessage="Nenhuma instituição encontrada."
            controlledSearchValue={searchText}
            onControlledSearchChange={handleSearchChange}
          />
          <Pagination
            page={page} totalPages={totalPages} totalElements={totalElements}
            pageSize={pageSize} onPageChange={setPage} onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}

      <DetailModal<InstituicaoUI>
        isOpen={isModalOpen} onClose={closeDetailModal} item={selected}
        fields={instituicaoDetailFields as any} title="Detalhes da Instituição"
        onEdit={handleEditar} onDelete={askExcluir}
      />
      <EditModal<InstituicaoUI>
        isOpen={isEditModalOpen} onClose={closeEditModal} onSave={handleSalvarEdicao as any}
        item={selected as any} fields={instituicaoEditFields as any} title="Editar Instituição"
      />
      <CreateModal
        isOpen={isCreateModalOpen} onClose={closeCreateModal} onSave={handleSalvarCriacao as any}
        fields={instituicaoCreateFields as any} title="Criar Nova Instituição"
      />
      <ConfirmModal
        isOpen={confirmOpen} title="Excluir Instituição"
        message={toDelete ? (<>
          Tem certeza que deseja excluir a instituição?<br />
          <strong>Nome:</strong> {toDelete.nome}
        </>) : 'Tem certeza que deseja excluir a instituição?'}
        confirmLabel="Excluir" cancelLabel="Cancelar" variant="danger"
        onConfirm={confirmExcluir}
        onCancel={() => { setConfirmOpen(false); setToDelete(null); }}
      />
    </div>
  );
};

export default Instituicoes;
