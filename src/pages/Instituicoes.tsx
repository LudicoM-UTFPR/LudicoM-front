import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { useCrudOperations, useInstituicoes as useInstituicoesHook } from '../shared/hooks';
import { instituicaoDetailFields, instituicaoEditFields, instituicaoCreateFields, INSTITUICAO_COLUMNS } from '../shared/constants';
import type { Instituicao, TableAction } from '../shared/types';

type InstituicaoUI = Instituicao & { id: string };

const Instituicoes: React.FC = () => {
  const { instituicoes: remoteInstituicoes, loading, error, createInstituicao, updateInstituicao, deleteInstituicao } = useInstituicoesHook();
  const [instituicoes, setInstituicoes] = useState<InstituicaoUI[]>([]);

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

  const handleExcluir = async (item: InstituicaoUI) => {
    if (!window.confirm(`Excluir a instituição "${item.nome}"?`)) return;
    try {
      await deleteInstituicao(item.uid);
      setInstituicoes(prev => prev.filter(i => i.id !== item.id));
    } catch (e) {
      // fallback local
      setInstituicoes(prev => prev.filter(i => i.id !== item.id));
    }
  };

  const localSalvarEdicao = createHandleSalvarEdicao(instituicoes, setInstituicoes);
  const handleSalvarEdicao = async (edited: Partial<InstituicaoUI>) => {
    if (!selected) return;
    const payload = { nome: edited.nome, endereco: edited.endereco } as Partial<Instituicao>;
    // otimista
    localSalvarEdicao({ ...selected, ...payload } as InstituicaoUI);
    try {
      const saved = await updateInstituicao(selected.uid, payload);
      setInstituicoes(prev => prev.map(i => i.id === selected.id ? { ...saved, id: saved.uid } : i));
    } catch {}
  };

  const localSalvarCriacao = createHandleSalvarCriacao(instituicoes, setInstituicoes);
  const handleSalvarCriacao = async (novo: Partial<Instituicao>) => {
    try {
      const saved = await createInstituicao({ nome: novo.nome || '', endereco: novo.endereco || '' });
      setInstituicoes(prev => [...prev, { ...saved, id: saved.uid }]);
    } catch (e) {
      // fallback local (gera id via factory)
      localSalvarCriacao(novo);
    }
  };

  const actions: TableAction<InstituicaoUI>[] = useMemo(() => ([
    { label: 'Detalhes', onClick: handleDetalhes, variant: 'primary' },
    { label: 'Editar', onClick: handleEditar, variant: 'secondary' },
    { label: 'Excluir', onClick: handleExcluir, variant: 'danger' }
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
        onDelete={handleExcluir}
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
    </div>
  );
};

export default Instituicoes;
