import React, { useState, useEffect } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { participanteDetailFields, participanteEditFields, participanteCreateFields, PARTICIPANTE_COLUMNS } from '../shared/constants';
import { instituicaoCreateFields } from '../shared/constants/createFields';
import { useCrudOperations, useParticipantes, useInstituicoes } from '../shared/hooks';
import { useToast } from '../components/common';
import type { Participante, TableAction, Instituicao } from '../shared/types';

const Participantes: React.FC = () => {
  // Hook para gerenciamento de dados
  const { participantes, loading, error, createParticipante, updateParticipante, deleteParticipante } = useParticipantes();
  const { instituicoes, createInstituicao } = useInstituicoes();
  const [localParticipantes, setLocalParticipantes] = useState<Participante[]>([]);
  const { showError, showErrorList, showSuccess, showWarning } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Participante | null>(null);
  const [showCreateInstituicao, setShowCreateInstituicao] = useState(false);
  const [newInstituicaoNamePrefill, setNewInstituicaoNamePrefill] = useState<string>('');
  
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
  const askExcluir = (participante: Participante) => {
    setToDelete(participante);
    setConfirmOpen(true);
  };

  // Criação inline de instituição a partir do modal de participante
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

  const confirmExcluir = async () => {
    if (!toDelete) return;
    try {
      if (deleteParticipante) {
        await deleteParticipante(String(toDelete.id));
        setLocalParticipantes(prev => prev.filter(p => p.id !== toDelete.id));
        showSuccess('Participante excluído com sucesso!');
      }
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
      showError('RA é obrigatório quando instituição é informada.');
      return;
    }
    // Unicidade (email, documento, ra) contra outros registros
    const errors: Record<string,string> = {};
    if (atualizado.email && localParticipantes.some(p => p.email === atualizado.email && p.id !== selectedParticipante.id)) {
      errors.email = 'Email já cadastrado.';
    }
    if (atualizado.documento && localParticipantes.some(p => p.documento === atualizado.documento && p.id !== selectedParticipante.id)) {
      errors.documento = 'Documento já cadastrado.';
    }
    if (atualizado.ra && localParticipantes.some(p => p.ra === atualizado.ra && p.id !== selectedParticipante.id)) {
      errors.ra = 'RA já cadastrado.';
    }
    if (Object.keys(errors).length) {
      showErrorList(errors);
      return;
    }
    const payload: Partial<Participante> = {
      nome: atualizado.nome,
      email: atualizado.email,
      documento: atualizado.documento,
      ra: atualizado.ra || '',
      idInstituicao: instituicaoObj ? instituicaoObj.uid : undefined
    };
    try {
      if (updateParticipante) {
        const saved = await updateParticipante(String(selectedParticipante.id), payload);
        const final = { ...saved, instituicao: instituicaoObj } as Participante;
        setLocalParticipantes(prev => prev.map(p => p.id === final.id ? final : p));
        showSuccess('Participante atualizado com sucesso!');
      }
    } catch (e: any) {
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showWarning(e?.message || 'Conflito ao atualizar participante.');
      } else if (e?.errors) {
        showErrorList(e.errors);
      } else {
        showError('Erro ao atualizar participante.');
      }
    }
  };

  const baseSalvarCriacao = createHandleSalvarCriacao(localParticipantes, setLocalParticipantes);
  const handleSalvarCriacao = async (novo: any) => {
    let instituicaoObj: Instituicao | undefined = undefined;
    if (novo.instituicao) {
      instituicaoObj = instituicoes.find(i => i.nome === novo.instituicao);
    }
    if (instituicaoObj && !novo.ra) {
      showError('RA é obrigatório quando instituição é informada.');
      return;
    }
    // Unicidade (email, documento, ra)
    const errors: Record<string,string> = {};
    if (novo.email && localParticipantes.some(p => p.email === novo.email)) {
      errors.email = 'Email já cadastrado.';
    }
    if (novo.documento && localParticipantes.some(p => p.documento === novo.documento)) {
      errors.documento = 'Documento já cadastrado.';
    }
    if (novo.ra && localParticipantes.some(p => p.ra === novo.ra)) {
      errors.ra = 'RA já cadastrado.';
    }
    if (Object.keys(errors).length) {
      showErrorList(errors);
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
        showSuccess('Participante criado com sucesso!');
        return;
      }
    } catch (e: any) {
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showWarning(e?.message || 'Conflito ao criar participante.');
      } else if (e?.errors) {
        showErrorList(e.errors);
      } else {
        showError('Erro ao criar participante.');
      }
      return;
    }
    // caso sem backend definido (fallback somente nesse cenário)
    if (!createParticipante) {
      baseSalvarCriacao({ ...payload, instituicao: instituicaoObj });
      showSuccess('Participante criado localmente (modo offline).');
    }
  };



  const actions: TableAction<Participante>[] = [
    { label: 'Detalhes', onClick: handleDetalhes, variant: 'primary' },
    { label: 'Editar', onClick: handleEditar, variant: 'secondary' },
    { label: 'Excluir', onClick: askExcluir, variant: 'danger' }
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
        onDelete={askExcluir}
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
        inlineFieldActions={{
          instituicao: {
            label: '+',
            title: 'Criar nova instituição',
            onClick: () => setShowCreateInstituicao(true)
          }
        }}
        prefill={newInstituicaoNamePrefill ? { instituicao: newInstituicaoNamePrefill } as any : undefined}
        title="Criar Novo Participante"
      />
      <CreateModal
        isOpen={showCreateInstituicao}
        onClose={() => setShowCreateInstituicao(false)}
        onSave={handleSalvarNovaInstituicao as any}
        fields={instituicaoCreateFields as any}
        title="Criar Instituição"
      />
      <ConfirmModal
        isOpen={confirmOpen}
        title="Excluir Participante"
        message={
          toDelete ? (
            <>
              Tem certeza que deseja excluir o participante?<br />
              <strong>Nome:</strong> {toDelete.nome}<br />
              <strong>Documento:</strong> {toDelete.documento}
            </>
          ) : 'Tem certeza que deseja excluir o participante?'
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

export default Participantes;