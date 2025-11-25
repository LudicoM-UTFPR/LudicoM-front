import React, { useState, useEffect } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { useToast } from '../components/common';
import { jogoDetailFields, jogoEditFields, jogoCreateFields, JOGO_COLUMNS } from '../shared/constants';
import { useCrudOperations, useJogos } from '../shared/hooks';
import type { Jogo, TableAction } from '../shared/types';

const Jogos: React.FC = () => {
  // Hook para gerenciamento de dados
  const { jogos, loading, error, createJogo, updateJogo, deleteJogo } = useJogos();
  const [localJogos, setLocalJogos] = useState<Jogo[]>([]);
  const { showSuccess, showError, showWarning, showErrorList } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Jogo | null>(null);
  
  // Hook personalizado para operações CRUD
  const {
    selectedItem: selectedJogo,
    isModalOpen,
    isEditModalOpen,
    isCreateModalOpen,
    handleDetalhes,
    handleEditar,
    handleCriar: handleCriarJogo,
    createHandleExcluir,
    createHandleSalvarEdicao,
    createHandleSalvarCriacao,
    closeDetailModal,
    closeEditModal,
    closeCreateModal
  } = useCrudOperations<Jogo>();

  // Sincroniza dados do hook com estado local para operações CRUD
  useEffect(() => {
    if (jogos.length > 0) {
      setLocalJogos(jogos);
    }
  }, [jogos]);

  // Handlers criados usando as factories do hook
  const handleExcluirLocal = createHandleExcluir(
    localJogos,
    setLocalJogos,
    (jogo) => `Tem certeza que deseja excluir o jogo?\n\nNome: ${jogo.nome}\nCódigo: ${jogo.codigoDeBarras}`
  );

  const handleSalvarEdicao = async (jogoAtualizado: Jogo) => {
    // Validação de unicidade local: codigoDeBarras (se informado)
    if (jogoAtualizado.codigoDeBarras) {
      const conflito = localJogos.some(j => j.codigoDeBarras === jogoAtualizado.codigoDeBarras && String(j.id) !== String(jogoAtualizado.id));
      if (conflito) {
        showError('Código de barras já cadastrado.');
        return;
      }
    }
    try {
      if (updateJogo) {
        const saved = await updateJogo(String(jogoAtualizado.id), jogoAtualizado);
        setLocalJogos(prev => prev.map(j => String(j.id) === String(saved.id) ? saved : j));
        showSuccess('Jogo atualizado com sucesso!');
        closeEditModal(); // Fecha apenas em caso de sucesso
      }
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

  // Exclusão que tenta o backend e faz fallback para o handler local
  const askExcluir = (jogo: Jogo) => {
    setToDelete(jogo);
    setConfirmOpen(true);
  };

  const confirmExcluir = async () => {
    if (!toDelete) return;
    try {
      if (deleteJogo) {
        await deleteJogo(String(toDelete.id));
        setLocalJogos(prev => prev.filter(j => String(j.id) !== String(toDelete.id)));
        showSuccess('Jogo excluído com sucesso!');
      } else {
        // modo sem backend: usa handler local
        handleExcluirLocal(toDelete);
        showSuccess('Jogo excluído localmente.');
      }
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

  // Substitui a criação local por uma que persiste no backend quando possível
  const handleSalvarCriacao = async (novo: any) => {
    // Validação de unicidade local: codigoDeBarras (se informado)
    if (novo?.codigoDeBarras) {
      const conflito = localJogos.some(j => j.codigoDeBarras === novo.codigoDeBarras);
      if (conflito) {
        showError('Código de barras já cadastrado.');
        return;
      }
    }
    try {
      if (createJogo) {
        const saved = await createJogo(novo);
        setLocalJogos(prev => [...prev, saved]);
        showSuccess('Jogo criado com sucesso!');
        closeCreateModal(); // Fecha apenas em caso de sucesso
      } else {
        // fallback local (modo offline)
        const temp = createHandleSalvarCriacao(localJogos, setLocalJogos);
        temp(novo);
        showSuccess('Jogo criado localmente (modo offline).');
        closeCreateModal(); // Fecha também para fallback local
      }
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
        buttonText="Criar Jogo"
        onButtonClick={handleCriarJogo}
      />
      <GenericTable<Jogo>
        data={localJogos}
        columns={JOGO_COLUMNS}
        actions={actions}
        searchPlaceholder="Buscar por jogo..."
        searchFields={['nome', 'nomeAlternativo', 'codigoDeBarras']}
        tableTitle="Jogos Cadastrados"
      />
      
      <DetailModal<Jogo>
        isOpen={isModalOpen}
        onClose={closeDetailModal}
        item={selectedJogo}
        fields={jogoDetailFields}
        title="Detalhes do Jogo"
        // fecha modal (factory controla estado internamente)
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