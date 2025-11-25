import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { useCrudOperations, useInstituicoes as useInstituicoesHook, useEventos } from '../shared/hooks';
import { instituicaoDetailFields, instituicaoEditFields, instituicaoCreateFields, INSTITUICAO_COLUMNS } from '../shared/constants';
import type { Instituicao, TableAction } from '../shared/types';
import { useToast } from '../components/common';

type InstituicaoUI = Instituicao & { id: string };

const Instituicoes: React.FC = () => {
  const { instituicoes: remoteInstituicoes, loading, error, createInstituicao, updateInstituicao, deleteInstituicao } = useInstituicoesHook();
  const { eventos } = useEventos();
  const [instituicoes, setInstituicoes] = useState<InstituicaoUI[]>([]);
  const { showError, showErrorList, showSuccess, showWarning } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<InstituicaoUI | null>(null);

  const {
    selectedItem: selected,
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
  } = useCrudOperations<InstituicaoUI>();

  useEffect(() => {
    if (remoteInstituicoes && remoteInstituicoes.length) {
      setInstituicoes(remoteInstituicoes.map(i => ({ ...i, id: i.uid })));
    }
  }, [remoteInstituicoes]);

  const askExcluir = (item: InstituicaoUI) => {
    setToDelete(item);
    setConfirmOpen(true);
  };

  const confirmExcluir = async () => {
    if (!toDelete) return;
    // Pré-validação local: impedir exclusão se houver eventos vinculados
    const vinculados = eventos.filter(ev => ev.idInstituicao === toDelete.uid || ev.instituicao?.uid === toDelete.uid);
    if (vinculados.length > 0) {
      showWarning(`Não é possível excluir: vinculada a ${vinculados.length} evento(s).`);
      setConfirmOpen(false);
      setToDelete(null);
      return;
    }
    try {
      await deleteInstituicao(toDelete.uid);
      setInstituicoes(prev => prev.filter(i => i.id !== toDelete.id));
      showSuccess('Instituição excluída com sucesso!');
    } catch (e: any) {
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showWarning(e?.message || 'Conflito: instituição vinculada a eventos.');
      } else if (e?.errors) {
        showErrorList(e.errors);
      } else {
        showError(e?.message || 'Erro ao excluir instituição.');
      }
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  const localSalvarEdicao = createHandleSalvarEdicao(instituicoes, setInstituicoes);
  const handleSalvarEdicao = async (edited: Partial<InstituicaoUI>) => {
    if (!selected) return;
    // unicidade local por nome (caso o backend também valide, evitamos ida desnecessária)
    const errors: Record<string,string> = {};
    if (edited.nome && instituicoes.some(i => i.nome === edited.nome && i.id !== selected.id)) {
      errors.nome = 'Nome de instituição já cadastrado.';
    }
    if (Object.keys(errors).length) {
      showErrorList(errors);
      return;
    }
    const payload = { nome: edited.nome, endereco: edited.endereco } as Partial<Instituicao>;
    try {
      const saved = await updateInstituicao(selected.uid, payload);
      setInstituicoes(prev => prev.map(i => i.id === selected.id ? { ...saved, id: saved.uid } : i));
      showSuccess('Instituição atualizada com sucesso!');
      closeEditModal(); // Fecha apenas em caso de sucesso
    } catch (e: any) {
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showWarning(e?.message || 'Conflito ao atualizar instituição.');
      } else if (e?.errors) {
        showErrorList(e.errors);
      } else {
        showError(e?.message || 'Erro ao atualizar instituição.');
      }
    }
  };

  const localSalvarCriacao = createHandleSalvarCriacao(instituicoes, setInstituicoes);
  const handleSalvarCriacao = async (novo: Partial<Instituicao>) => {
    // unicidade local por nome
    const errors: Record<string,string> = {};
    if (novo.nome && instituicoes.some(i => i.nome === novo.nome)) {
      errors.nome = 'Nome de instituição já cadastrado.';
    }
    if (Object.keys(errors).length) {
      showErrorList(errors);
      return;
    }
    try {
      if (createInstituicao) {
        const saved = await createInstituicao({ nome: novo.nome || '', endereco: novo.endereco || '' });
        setInstituicoes(prev => [...prev, { ...saved, id: saved.uid }]);
        showSuccess('Instituição criada com sucesso!');
        closeCreateModal(); // Fecha apenas em caso de sucesso
      } else {
        // modo offline
        localSalvarCriacao(novo);
        showSuccess('Instituição criada localmente (modo offline).');
        closeCreateModal(); // Fecha também para fallback local
      }
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

  const actions: TableAction<InstituicaoUI>[] = useMemo(() => ([
    { label: 'Detalhes', onClick: handleDetalhes, variant: 'primary' },
    { label: 'Editar', onClick: handleEditar, variant: 'secondary' },
    { label: 'Excluir', onClick: askExcluir, variant: 'danger' }
  ]), [instituicoes]);

  return (
    <div className="page-container">
      <PageHeader
        title="Gerenciamento de Instituições"
        buttonText="Criar Instituição"
        onButtonClick={handleCriar}
      />

      <GenericTable<InstituicaoUI>
        data={instituicoes}
        columns={INSTITUICAO_COLUMNS as any}
        actions={actions}
        searchPlaceholder="Buscar por instituição..."
        searchFields={['nome', 'endereco'] as any}
        tableTitle="Instituições Cadastradas"
      />

      {loading && <p>Carregando instituições...</p>}
      {error && <p className="error">{error}</p>}

      <DetailModal<InstituicaoUI>
        isOpen={isModalOpen}
        onClose={closeDetailModal}
        item={selected}
        fields={instituicaoDetailFields as any}
        title="Detalhes da Instituição"
        onEdit={handleEditar}
        onDelete={askExcluir}
      />

      <EditModal<InstituicaoUI>
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleSalvarEdicao as any}
        item={selected as any}
        fields={instituicaoEditFields as any}
        title="Editar Instituição"
      />

      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSave={handleSalvarCriacao as any}
        fields={instituicaoCreateFields as any}
        title="Criar Nova Instituição"
      />
      <ConfirmModal
        isOpen={confirmOpen}
        title="Excluir Instituição"
        message={
          toDelete ? (
            <>
              Tem certeza que deseja excluir a instituição?<br />
              <strong>Nome:</strong> {toDelete.nome}
            </>
          ) : 'Tem certeza que deseja excluir a instituição?'
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

export default Instituicoes;
