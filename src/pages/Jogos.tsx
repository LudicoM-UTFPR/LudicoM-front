import React, { useState, useEffect } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { jogoDetailFields, jogoEditFields, jogoCreateFields, JOGO_COLUMNS } from '../shared/constants';
import { useCrudOperations, useJogos } from '../shared/hooks';
import type { Jogo, TableAction } from '../shared/types';

const Jogos: React.FC = () => {
  // Hook para gerenciamento de dados
  const { jogos, loading, error } = useJogos();
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

  const handleSalvarEdicao = createHandleSalvarEdicao(
    localJogos,
    setLocalJogos,
    (jogo) => ({ ...jogo, atualizadoQuando: new Date().toISOString() })
  );

  const handleSalvarCriacao = createHandleSalvarCriacao(
    localJogos,
    setLocalJogos
  );



  const actions: TableAction<Jogo>[] = [
    { label: 'Detalhes', onClick: handleDetalhes, variant: 'primary' },
    { label: 'Editar', onClick: handleEditar, variant: 'secondary' },
    { label: 'Excluir', onClick: handleExcluir, variant: 'danger' }
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
        onEdit={handleEditar}
        onDelete={handleExcluir}
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