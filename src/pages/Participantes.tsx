import React, { useState, useEffect } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { participanteDetailFields, participanteEditFields, participanteCreateFields, PARTICIPANTE_COLUMNS } from '../shared/constants';
import { useCrudOperations, useParticipantes, useInstituicoes } from '../shared/hooks';
import type { Participante, TableAction, Instituicao } from '../shared/types';

const Participantes: React.FC = () => {
  // Hook para gerenciamento de dados
  const { participantes, loading, error, createParticipante, updateParticipante, deleteParticipante } = useParticipantes();
  const { instituicoes } = useInstituicoes();
  const [localParticipantes, setLocalParticipantes] = useState<Participante[]>([]);
  
  // Hook personalizado para operações CRUD
  const {
    selectedItem: selectedParticipante,
    isModalOpen,
    isEditModalOpen,
    isCreateModalOpen,
    handleDetalhes,
    handleEditar,
    handleCriar: handleAdicionarParticipante,
    createHandleExcluir,
    createHandleSalvarEdicao,
    createHandleSalvarCriacao,
    closeDetailModal,
    closeEditModal,
    closeCreateModal
  } = useCrudOperations<Participante>();

  // Sincroniza dados do hook com estado local para operações CRUD
  useEffect(() => {
    if (participantes.length > 0) {
      setLocalParticipantes(participantes);
    }
  }, [participantes]);

  // Handlers criados usando as factories do hook
  const handleExcluir = async (participante: Participante) => {
    if (!window.confirm(`Tem certeza que deseja excluir o participante?\n\nNome: ${participante.nome}\nDocumento: ${participante.documento}`)) return;
    try {
      if (deleteParticipante) {
        await deleteParticipante(String(participante.id));
        setLocalParticipantes(prev => prev.filter(p => p.id !== participante.id));
      }
    } catch (e) {
      // fallback local
      setLocalParticipantes(prev => prev.filter(p => p.id !== participante.id));
    }
  };

  const baseSalvarEdicao = createHandleSalvarEdicao(localParticipantes, setLocalParticipantes);
  const handleSalvarEdicao = async (atualizado: any) => {
    if (!selectedParticipante) return;
    // Resolve instituição selecionada
    let instituicaoObj: Instituicao | undefined = undefined;
    if (atualizado.instituicao) {
      instituicaoObj = instituicoes.find(i => i.nome === atualizado.instituicao);
    }
    // Validação condicional RA
    if (instituicaoObj && !atualizado.ra) {
      alert('RA é obrigatório quando instituição é informada.');
      return;
    }
    const payload: Partial<Participante> = {
      nome: atualizado.nome,
      email: atualizado.email,
      documento: atualizado.documento,
      ra: atualizado.ra || '',
      idInstituicao: instituicaoObj ? instituicaoObj.uid : undefined
    };
    // Otimista
    baseSalvarEdicao({ ...selectedParticipante, ...payload, instituicao: instituicaoObj } as Participante);
    try {
      if (updateParticipante) {
        const saved = await updateParticipante(String(selectedParticipante.id), payload);
        const final = { ...saved, instituicao: instituicaoObj } as Participante;
        setLocalParticipantes(prev => prev.map(p => p.id === final.id ? final : p));
      }
    } catch (e) {
      // erro já logado por hook
    }
  };

  const baseSalvarCriacao = createHandleSalvarCriacao(localParticipantes, setLocalParticipantes);
  const handleSalvarCriacao = async (novo: any) => {
    let instituicaoObj: Instituicao | undefined = undefined;
    if (novo.instituicao) {
      instituicaoObj = instituicoes.find(i => i.nome === novo.instituicao);
    }
    if (instituicaoObj && !novo.ra) {
      alert('RA é obrigatório quando instituição é informada.');
      return;
    }
    const payload: Partial<Participante> = {
      nome: novo.nome,
      email: novo.email,
      documento: novo.documento,
      ra: novo.ra || '',
      idInstituicao: instituicaoObj ? instituicaoObj.uid : undefined
    };
    try {
      if (createParticipante) {
        const saved = await createParticipante(payload);
        const final = { ...saved, instituicao: instituicaoObj } as Participante;
        setLocalParticipantes(prev => [...prev, final]);
        return;
      }
    } catch (e) {
      // fallback local
      baseSalvarCriacao({ ...payload, instituicao: instituicaoObj });
      return;
    }
    // caso sem backend (fallback)
    baseSalvarCriacao({ ...payload, instituicao: instituicaoObj });
  };



  const actions: TableAction<Participante>[] = [
    { label: 'Detalhes', onClick: handleDetalhes, variant: 'primary' },
    { label: 'Editar', onClick: handleEditar, variant: 'secondary' },
    { label: 'Excluir', onClick: handleExcluir, variant: 'danger' }
  ];

  return (
    <div className="page-container">
      <PageHeader 
        title="Gerenciamento de Participantes"
        buttonText="Adicionar Participante"
        onButtonClick={handleAdicionarParticipante}
      />
      <GenericTable<Participante>
        data={localParticipantes}
        columns={PARTICIPANTE_COLUMNS}
        actions={actions}
        searchPlaceholder="Buscar por participante..."
        searchFields={['nome', 'email', 'documento', 'ra']}
        tableTitle="Participantes Cadastrados"
      />
      
      <DetailModal<Participante>
        isOpen={isModalOpen}
        onClose={closeDetailModal}
        item={selectedParticipante}
        fields={participanteDetailFields}
        title="Detalhes do Participante"
        onEdit={handleEditar}
        onDelete={handleExcluir}
      />

      <EditModal<Participante>
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleSalvarEdicao}
        item={selectedParticipante}
        fields={participanteEditFields.map(f => f.key === 'instituicao' ? {
          ...f,
          options: instituicoes.map(i => ({ value: i.nome, label: i.nome }))
        } : f)}
        title="Editar Participante"
      />

      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSave={handleSalvarCriacao}
        fields={participanteCreateFields.map(f => f.key === 'instituicao' ? {
          ...f,
          options: instituicoes.map(i => ({ value: i.nome, label: i.nome }))
        } : f)}
        title="Criar Novo Participante"
      />
    </div>
  );
};

export default Participantes;