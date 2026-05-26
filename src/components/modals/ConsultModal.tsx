import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GenericTable, DetailModal, EditModal, Pagination } from '../';
import { jogoDetailFields, jogoEditFields, JOGO_COLUMNS } from '../../shared/constants';
import { useCrudOperations } from '../../shared/hooks';
import { fetchJogosPaginated, updateJogo, deleteJogo } from '../../shared/services/jogosService';
import type { Jogo, TableAction } from '../../shared/types';

interface ConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJogoUpdated?: (jogo: Jogo) => void;
  onJogoDeleted?: (jogoId: number | string) => void;
}

export function ConsultModal({
  isOpen,
  onClose,
  onJogoUpdated,
  onJogoDeleted
}: ConsultModalProps) {
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
    isModalOpen: isDetailModalOpen,
    handleDetalhes: openDetailModal,
    closeDetailModal,
    handleEditar,
    isEditModalOpen,
    closeEditModal
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
    if (!isOpen) return;
    setPage(0);
    setSearchText('');
    setDebouncedSearch('');
    fetchPage(0, '', pageSize);
  }, [isOpen]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchText);
      if (searchText !== debouncedSearch) setPage(0);
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchText]);

  useEffect(() => {
    if (isOpen) fetchPage(page, debouncedSearch, pageSize);
  }, [page, debouncedSearch, pageSize, isOpen, fetchPage]);

  const handleSearchChange = useCallback((value: string) => setSearchText(value), []);
  const handlePageSizeChange = useCallback((size: number) => { setPageSize(size); setPage(0); }, []);

  const handleSalvarEdicao = async (jogoAtualizado: Jogo) => {
    try {
      const saved = await updateJogo(String(jogoAtualizado.id), jogoAtualizado);
      setJogos(prev => prev.map(j => String(j.id) === String(saved.id) ? { ...j, ...saved } : j));
      if (onJogoUpdated) onJogoUpdated(saved);
      closeEditModal();
    } catch {
      // errors handled by GenericTable
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const actions: TableAction<Jogo>[] = [
    { label: 'Detalhes', onClick: openDetailModal, variant: 'primary' },
    { label: 'Editar', onClick: handleEditar, variant: 'secondary' },
  ];

  return (
    <>
      <div className="modal-backdrop" onClick={handleBackdropClick}>
        <div className="modal modal--edit"
          style={{ maxWidth: '90vw', maxHeight: '90vh' }}
        >
          <div className="modal-header">
            <h2>Consultar Jogos</h2>
            <button className="close-button" onClick={onClose} type="button" aria-label="Fechar modal">✕</button>
          </div>

          <div className="modal-content" style={{ padding: '12px', overflow: 'visible' }}>
            {loading && jogos.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando...</p>}
            {error && jogos.length === 0 && <p style={{ textAlign: 'center', color: 'var(--btn-danger)' }}>{error}</p>}
            {(jogos.length > 0 || !loading) && (
              <div style={{ opacity: loading && jogos.length > 0 ? 0.5 : 1, transition: 'opacity 0.15s ease' }}>
                <GenericTable<Jogo>
                  data={jogos}
                  columns={JOGO_COLUMNS}
                  actions={actions}
                  searchPlaceholder="Buscar por jogo..."
                  searchFields={['nome', 'nomeAlternativo', 'codigoDeBarras']}
                  tableTitle="Jogos Disponíveis"
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
          </div>
        </div>
      </div>

      <DetailModal<Jogo>
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        item={selectedJogo}
        fields={jogoDetailFields}
        title="Detalhes do Jogo"
      />

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
