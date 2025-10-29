import React, { useState, useEffect } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { jogoDetailFields, jogoEditFields, jogoCreateFields, JOGO_COLUMNS } from '../shared/constants';
import { useCrudOperations, useJogos } from '../shared/hooks';
import type { Jogo, TableAction } from '../shared/types';

const Jogos: React.FC = () => {
  // Hook para gerenciamento de dados
  const { jogos, loading, error, createJogo, updateJogo, deleteJogo } = useJogos();
  const [localJogos, setLocalJogos] = useState<Jogo[]>([]);
  
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
  const handleExcluir = createHandleExcluir(
    localJogos,
    setLocalJogos,
    (jogo) => `Tem certeza que deseja excluir o jogo?\n\nNome: ${jogo.nome}\nCódigo: ${jogo.codigoDeBarras}`
  );

  const baseHandleSalvarEdicao = createHandleSalvarEdicao(
    localJogos,
    setLocalJogos,
    (jogo) => ({ ...jogo, atualizadoQuando: new Date().toISOString() })
  );

  const handleSalvarEdicao = async (jogoAtualizado: Jogo) => {
    // Atualiza otimistamente no cliente
    baseHandleSalvarEdicao(jogoAtualizado);
    try {
      if (updateJogo) {
        await updateJogo(String(jogoAtualizado.id), jogoAtualizado);
      }
    } catch (err) {
      console.error('Erro ao atualizar jogo no backend', err);
    }
  };

  // Exclusão que tenta o backend e faz fallback para o handler local
  const handleExcluirRemote = async (jogo: Jogo) => {
    if (!window.confirm(`Tem certeza que deseja excluir o jogo?\n\nNome: ${jogo.nome}\nCódigo: ${jogo.codigoDeBarras}`)) return;
    try {
      if (deleteJogo) {
        await deleteJogo(String(jogo.id));
        setLocalJogos(prev => prev.filter(j => String(j.id) !== String(jogo.id)));
      } else {
        handleExcluir(jogo);
      }
    } catch (err) {
      console.error('Erro ao deletar jogo no backend', err);
      // fallback local
      handleExcluir(jogo);
    }
  };

  // Substitui a criação local por uma que persiste no backend quando possível
  const handleSalvarCriacao = async (novo: any) => {
    try {
      if (createJogo) {
        const saved = await createJogo(novo);
        setLocalJogos(prev => [...prev, saved]);
      } else {
        // fallback local
        const temp = createHandleSalvarCriacao(localJogos, setLocalJogos);
        temp(novo);
      }
    } catch (err) {
      // Em caso de erro, tenta salvar localmente
      const temp = createHandleSalvarCriacao(localJogos, setLocalJogos);
      temp(novo);
    }
    // fecha modal (factory controla estado internamente)
    // closeCreateModal está disponível via hook
  };
  const actions: TableAction<Jogo>[] = [
    { label: 'Detalhes', onClick: handleDetalhes, variant: 'primary' },
    { label: 'Editar', onClick: handleEditar, variant: 'secondary' },
    { label: 'Excluir', onClick: handleExcluirRemote, variant: 'danger' }
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
        onDelete={handleExcluirRemote}
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
    </div>
  );
};

export default Jogos;