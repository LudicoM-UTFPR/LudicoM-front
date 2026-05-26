import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal, Pagination } from '../components';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { participanteDetailFields, participanteEditFields, participanteCreateFields, PARTICIPANTE_COLUMNS } from '../shared/constants';
import { instituicaoCreateFields } from '../shared/constants/createFields';
import { useCrudOperations, useInstituicoes } from '../shared/hooks';
import { fetchParticipantesPaginated, createParticipante, updateParticipante, deleteParticipante } from '../shared/services/participanteService';
import { useToast } from '../components/common';
import type { Participante, TableAction, Instituicao } from '../shared/types';

const Participantes: React.FC = () => {
  const { instituicoes, createInstituicao } = useInstituicoes();
  const { showError, showErrorList, showSuccess, showWarning } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Participante | null>(null);
  const [showCreateInstituicao, setShowCreateInstituicao] = useState(false);
  const [newInstituicaoNamePrefill, setNewInstituicaoNamePrefill] = useState<string>('');

  const [participantes, setParticipantes] = useState<Participante[]>([]);
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
    selectedItem: selectedParticipante,
    isModalOpen,
    isEditModalOpen,
    isCreateModalOpen,
    handleDetalhes,
    handleEditar,
    handleCriar: handleAdicionarParticipante,
    closeDetailModal,
    closeEditModal,
    closeCreateModal
  } = useCrudOperations<Participante>();

  const fetchPage = useCallback(async (p: number, search: string, size: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchParticipantesPaginated(p, size, search || undefined);
      setParticipantes(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      setPage(result.number);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError('Erro ao carregar participantes.');
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

  const askExcluir = (participante: Participante) => {
    setToDelete(participante);
    setConfirmOpen(true);
  };

  const confirmExcluir = async () => {
    if (!toDelete) return;
    try {
      await deleteParticipante(String(toDelete.id));
      showSuccess('Participante excluído com sucesso!');
      refetchCurrentPage();
    } catch (e: any) {
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showWarning(e?.message || 'Conflito: não é possível excluir participante.');
      } else if (e?.errors) {
        showErrorList(e.errors);
      } else {
        showError(e?.message || 'Erro ao excluir participante.');
      }
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const handleSalvarEdicao = async (atualizado: any) => {
    if (!selectedParticipante) return;
    let instituicaoObj: Instituicao | undefined;
    if (atualizado.instituicao) {
      instituicaoObj = instituicoes.find(i => i.nome === atualizado.instituicao);
    }
    if (instituicaoObj && !atualizado.ra) {
      showError('RA é obrigatório quando instituição é informada.');
      return;
    }
    const errors: Record<string,string> = {};
    if (atualizado.email && participantes.some(p => p.email === atualizado.email && p.id !== selectedParticipante.id)) {
      errors.email = 'Email já cadastrado.';
    }
    if (atualizado.documento && participantes.some(p => p.documento === atualizado.documento && p.id !== selectedParticipante.id)) {
      errors.documento = 'Documento já cadastrado.';
    }
    if (atualizado.ra && participantes.some(p => p.ra === atualizado.ra && p.id !== selectedParticipante.id)) {
      errors.ra = 'RA já cadastrado.';
    }
    if (Object.keys(errors).length) { showErrorList(errors); return; }
    const payload: Partial<Participante> = {
      nome: atualizado.nome, email: atualizado.email, documento: atualizado.documento,
      ra: atualizado.ra || '', idInstituicao: instituicaoObj ? instituicaoObj.uid : undefined
    };
    try {
      const saved = await updateParticipante(String(selectedParticipante.id), payload);
      const final = { ...saved, instituicao: instituicaoObj } as Participante;
      setParticipantes(prev => prev.map(p => p.id === final.id ? final : p));
      showSuccess('Participante atualizado com sucesso!');
      closeEditModal();
      refetchCurrentPage();
    } catch (e: any) {
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showWarning(e?.message || 'Conflito ao atualizar participante.');
      } else if (e?.errors) { showErrorList(e.errors); } else { showError('Erro ao atualizar participante.'); }
    }
  };

  const handleSalvarCriacao = async (novo: any) => {
    let instituicaoObj: Instituicao | undefined;
    if (novo.instituicao) {
      instituicaoObj = instituicoes.find(i => i.nome === novo.instituicao);
    }
    if (instituicaoObj && !novo.ra) {
      showError('RA é obrigatório quando instituição é informada.');
      return;
    }
    const errors: Record<string,string> = {};
    if (novo.email && participantes.some(p => p.email === novo.email)) errors.email = 'Email já cadastrado.';
    if (novo.documento && participantes.some(p => p.documento === novo.documento)) errors.documento = 'Documento já cadastrado.';
    if (novo.ra && participantes.some(p => p.ra === novo.ra)) errors.ra = 'RA já cadastrado.';
    if (Object.keys(errors).length) { showErrorList(errors); return; }
    const payload: Partial<Participante> = {
      nome: novo.nome, email: novo.email, documento: novo.documento,
      ra: novo.ra || '', idInstituicao: instituicaoObj ? instituicaoObj.uid : undefined
    };
    try {
      await createParticipante(payload);
      showSuccess('Participante criado com sucesso!');
      closeCreateModal();
      setPage(0);
      setDebouncedSearch('');
      setSearchText('');
    } catch (e: any) {
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showWarning(e?.message || 'Conflito ao criar participante.');
      } else if (e?.errors) { showErrorList(e.errors); } else { showError('Erro ao criar participante.'); }
    }
  };

  const actions: TableAction<Participante>[] = [
    { label: 'Detalhes', onClick: handleDetalhes, variant: 'primary' },
    { label: 'Editar', onClick: handleEditar, variant: 'secondary' },
    { label: 'Excluir', onClick: askExcluir, variant: 'danger' }
  ];

  return (
    <div className="page-container">
      <PageHeader title="Gerenciamento de Participantes" showButton={false} />
      <section style={{ marginBottom: '24px', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div className="acoes-buttons">
          <button type="button" className="btn btn--xlarge" onClick={handleAdicionarParticipante}>
            Adicionar Participante
          </button>
        </div>
      </section>

      {loading && participantes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Carregando...</div>
      )}
      {error && participantes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--btn-danger)' }}>{error}</div>
      )}
      {(participantes.length > 0 || !loading) && (
        <div style={{ opacity: loading && participantes.length > 0 ? 0.5 : 1, transition: 'opacity 0.15s ease' }}>
          <GenericTable<Participante>
            data={participantes}
            columns={PARTICIPANTE_COLUMNS}
            actions={actions}
            searchPlaceholder="Buscar por participante..."
            searchFields={['nome', 'email', 'documento', 'ra']}
            tableTitle="Participantes Cadastrados"
            emptyMessage="Nenhum participante encontrado."
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

      <DetailModal<Participante>
        isOpen={isModalOpen} onClose={closeDetailModal} item={selectedParticipante}
        fields={participanteDetailFields} title="Detalhes do Participante"
        onEdit={handleEditar} onDelete={askExcluir}
      />
      <EditModal<Participante>
        isOpen={isEditModalOpen} onClose={closeEditModal} onSave={handleSalvarEdicao}
        item={selectedParticipante}
        fields={participanteEditFields.map(f => f.key === 'instituicao' ? { ...f, options: instituicoes.map(i => ({ value: i.nome, label: i.nome })) } : f)}
        title="Editar Participante"
      />
      <CreateModal
        isOpen={isCreateModalOpen} onClose={closeCreateModal} onSave={handleSalvarCriacao}
        fields={participanteCreateFields.map(f => f.key === 'instituicao' ? { ...f, options: instituicoes.map(i => ({ value: i.nome, label: i.nome })) } : f)}
        inlineFieldActions={{ instituicao: { label: '+', title: 'Criar nova instituição', onClick: () => setShowCreateInstituicao(true) } }}
        prefill={newInstituicaoNamePrefill ? { instituicao: newInstituicaoNamePrefill } as any : undefined}
        title="Criar Novo Participante"
      />
      <CreateModal
        isOpen={showCreateInstituicao} onClose={() => setShowCreateInstituicao(false)}
        onSave={handleSalvarNovaInstituicao as any} fields={instituicaoCreateFields as any} title="Criar Instituição"
      />
      <ConfirmModal
        isOpen={confirmOpen} title="Excluir Participante"
        message={toDelete ? (<>
          Tem certeza que deseja excluir o participante?<br />
          <strong>Nome:</strong> {toDelete.nome}<br />
          <strong>Documento:</strong> {toDelete.documento}
        </>) : 'Tem certeza que deseja excluir o participante?'}
        confirmLabel="Excluir" cancelLabel="Cancelar" variant="danger"
        onConfirm={confirmExcluir}
        onCancel={() => { setConfirmOpen(false); setToDelete(null); }}
      />
    </div>
  );
};

export default Participantes;
