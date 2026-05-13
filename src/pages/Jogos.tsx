import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal, Pagination } from '../components';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { useToast } from '../components/common';
import { jogoDetailFields, jogoEditFields, jogoCreateFields, JOGO_COLUMNS } from '../shared/constants';
import { useCrudOperations } from '../shared/hooks';
import { fetchJogosPaginated, createJogo, updateJogo, deleteJogo } from '../shared/services/jogosService';
import type { Jogo, TableAction } from '../shared/types';

const Jogos: React.FC = () => {
  const { showSuccess, showError, showWarning, showErrorList } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Jogo | null>(null);

  const [jogos, setJogos] = useState<Jogo[]>([]);
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
    selectedItem: selectedJogo,
    isModalOpen,
    isEditModalOpen,
    isCreateModalOpen,
    handleDetalhes,
    handleEditar,
    handleCriar: handleCriarJogo,
    closeDetailModal,
    closeEditModal,
    closeCreateModal
  } = useCrudOperations<Jogo>();

  const fetchPage = useCallback(async (p: number, search: string, size: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchJogosPaginated(p, size, search || undefined);
      setJogos(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      setPage(result.number);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError('Erro ao carregar jogos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchText);
      if (searchText !== debouncedSearch) {
        setPage(0);
      }
    }, 300);
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchText]);

  useEffect(() => {
    fetchPage(page, debouncedSearch, pageSize);
  }, [page, debouncedSearch, pageSize, fetchPage]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(0);
  }, []);

  const refetchCurrentPage = useCallback(() => {
    fetchPage(page, debouncedSearch, pageSize);
  }, [page, debouncedSearch, pageSize, fetchPage]);

  const handleSalvarEdicao = async (jogoAtualizado: Jogo) => {
    try {
      const saved = await updateJogo(String(jogoAtualizado.id), jogoAtualizado);
      showSuccess('Jogo atualizado com sucesso!');
      closeEditModal();
      refetchCurrentPage();
    } catch (err: any) {
      if (err?.status === 409) {
        if (err?.errors) showErrorList(err.errors, 'warning'); else showWarning(err?.message || 'Conflito ao atualizar jogo.');
      } else if (err?.errors) {
        showErrorList(err.errors);
      } else {
        showError(err?.message || 'Erro ao atualizar jogo.');
      }
    }
  };

  const askExcluir = (jogo: Jogo) => {
    setToDelete(jogo);
    setConfirmOpen(true);
  };

  const confirmExcluir = async () => {
    if (!toDelete) return;
    try {
      await deleteJogo(String(toDelete.id));
      showSuccess('Jogo excluído com sucesso!');
      refetchCurrentPage();
    } catch (err: any) {
      if (err?.status === 409) {
        if (err?.errors) showErrorList(err.errors, 'warning'); else showWarning(err?.message || 'Conflito: não é possível excluir jogo.');
      } else if (err?.errors) {
        showErrorList(err.errors);
      } else {
        showError(err?.message || 'Erro ao excluir jogo.');
      }
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const handleSalvarCriacao = async (novo: any) => {
    try {
      await createJogo(novo);
      showSuccess('Jogo criado com sucesso!');
      closeCreateModal();
      setPage(0);
      setDebouncedSearch('');
      setSearchText('');
    } catch (err: any) {
      if (err?.status === 409) {
        if (err?.errors) showErrorList(err.errors, 'warning'); else showWarning(err?.message || 'Conflito ao criar jogo.');
      } else if (err?.errors) {
        showErrorList(err.errors);
      } else {
        showError(err?.message || 'Erro ao criar jogo.');
      }
    }
  };

  const actions: TableAction<Jogo>[] = [
    { label: 'Detalhes', onClick: handleDetalhes, variant: 'primary' },
    { label: 'Editar', onClick: handleEditar, variant: 'secondary' },
    { label: 'Excluir', onClick: askExcluir, variant: 'danger' }
  ];

  return (
    <div className="page-container">
      <PageHeader 
        title="Gerenciamento de Jogos"
        showButton={false}
      />
      <section style={{ marginBottom: '24px', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div className="acoes-buttons">
          <button
            type="button"
            className="btn btn--xlarge"
            onClick={handleCriarJogo}
          >
            Criar Jogo
          </button>
        </div>
      </section>

      {loading && jogos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Carregando...
        </div>
      )}

      {error && jogos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--btn-danger)' }}>
          {error}
        </div>
      )}

      {(jogos.length > 0 || !loading) && (
        <div style={{ opacity: loading && jogos.length > 0 ? 0.5 : 1, transition: 'opacity 0.15s ease' }}>
          <GenericTable<Jogo>
            data={jogos}
            columns={JOGO_COLUMNS}
            actions={actions}
            searchPlaceholder="Buscar por jogo..."
            searchFields={['nome', 'nomeAlternativo', 'codigoDeBarras']}
            tableTitle="Jogos Cadastrados"
            emptyMessage="Nenhum jogo encontrado."
            controlledSearchValue={searchText}
            onControlledSearchChange={handleSearchChange}
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}
      
      <DetailModal<Jogo>
        isOpen={isModalOpen}
        onClose={closeDetailModal}
        item={selectedJogo}
        fields={jogoDetailFields}
        title="Detalhes do Jogo"
        onDelete={askExcluir}
      />

      <EditModal<Jogo>
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleSalvarEdicao}
        item={selectedJogo}
        fields={jogoEditFields}
        title="Editar Jogo"
      />

      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSave={handleSalvarCriacao}
        fields={jogoCreateFields}
        title="Criar Novo Jogo"
      />
      <ConfirmModal
        isOpen={confirmOpen}
        title="Excluir Jogo"
        message={
          toDelete ? (
            <>
              Tem certeza que deseja excluir o jogo?<br />
              <strong>Nome:</strong> {toDelete.nome}<br />
              <strong>Código:</strong> {toDelete.codigoDeBarras}
            </>
          ) : 'Tem certeza que deseja excluir o jogo?'
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

export default Jogos;
