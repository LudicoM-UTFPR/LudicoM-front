import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { useToast } from '../components/common';
import { emprestimoDetailFields, emprestimoEditFields, emprestimoCreateFields, MESSAGES, EMPRESTIMO_COLUMNS, EMPRESTIMO_DETAIL_COLUMNS } from '../shared/constants';
import { useJogos, useParticipantes } from '../shared/hooks';
import { createEmprestimo, updateEmprestimo, deleteEmprestimo, fetchEmprestimos } from '../shared/services/emprestimosService';
import type { CreateField } from '../components/modals/CreateModal';
import emprestimosData from '../shared/data/emprestimos.json';
import { handleError, formatTimeHHMM, isoToHHMM, getDevolvidosLocal, generateId } from '../shared/utils';
import type { Emprestimo, TableAction } from '../shared/types';

const Emprestimos: React.FC = () => {
  const { jogos } = useJogos();
  const { participantes } = useParticipantes();
  const { showErrorList, showError, showSuccess } = useToast();
  const [emprestimosAtivos, setEmprestimosAtivos] = useState<Emprestimo[]>([]);
  const [historicoEmprestimos, setHistoricoEmprestimos] = useState<Emprestimo[]>([]);
  const [selectedEmprestimo, setSelectedEmprestimo] = useState<Emprestimo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    try {
      // Validação e carregamento dos dados
      const allValidatedData = emprestimosData.map((item): Emprestimo => ({
        id: String(item.id),
        idJogo: String(item.idJogo),
        idParticipante: String(item.idParticipante),
        idEvento: String(item.idEvento),
        // normaliza para HH:mm quando possível
        horaEmprestimo: item.horaEmprestimo && String(item.horaEmprestimo).includes('T') ? (isoToHHMM(String(item.horaEmprestimo)) || '') : String(item.horaEmprestimo || ''),
        horaDevolucao: item.horaDevolucao && String(item.horaDevolucao).includes('T') ? isoToHHMM(String(item.horaDevolucao)) : (item.horaDevolucao ? String(item.horaDevolucao) : null),
        isDevolvido: Boolean(item.isDevolvido),
        // Campos computados para exibição
        jogo: String(item.jogo || ""),
        participante: String(item.participante || ""),
        horario: String(item.horario || "")
      }));

    // Aplica devoluções marcadas localmente (sincroniza com Home)
    const devolvidosMap = getDevolvidosLocal();

    const ativos = allValidatedData.filter(item => !item.isDevolvido && !devolvidosMap[String(item.id)]);
    const historicoFromSource = allValidatedData.filter(item => item.isDevolvido);

    // itens devolvidos via UI local
    const historicoFromLocal = Object.keys(devolvidosMap).map(key => {
      const id = String(key);
      const original = allValidatedData.find(a => String(a.id) === id);
      if (!original) return null;
      return { ...original, isDevolvido: true, horaDevolucao: devolvidosMap[key] } as Emprestimo;
    }).filter(Boolean) as Emprestimo[];

    const historico = [...historicoFromSource, ...historicoFromLocal];

    setEmprestimosAtivos(ativos);
    setHistoricoEmprestimos(historico);
    } catch (error) {
      handleError(error, "Emprestimos - Data Loading");
    }
  }, []);

  const handleRegistrarEmprestimo = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleSalvarCriacao = async (novoEmprestimo: any) => {
    try {
      // Encontrar jogo e participante pelos nomes para pegar os IDs
      const jogoSelecionado = jogos.find(j => j.nome === novoEmprestimo.jogo);
      const participanteSelecionado = participantes.find(p => p.nome === novoEmprestimo.participante);

      if (!jogoSelecionado) {
        showError('Jogo não encontrado. Selecione um jogo válido.');
        return;
      }

      if (!participanteSelecionado) {
        showError('Participante não encontrado. Selecione um participante válido.');
        return;
      }

      // Construir payload para API - usa uid (UUID) quando disponível
      const payload = {
        idJogo: (jogoSelecionado as any).uid || jogoSelecionado.id,
        idParticipante: (participanteSelecionado as any).uid || participanteSelecionado.id,
        idEvento: '1', // TODO: pegar do contexto ou evento atual
        horaEmprestimo: novoEmprestimo.horaEmprestimo,
        horaDevolucao: novoEmprestimo.horaDevolucao || null,
        isDevolvido: novoEmprestimo.isDevolvido || false,
        observacoes: novoEmprestimo.observacoes || ''
      };

      const saved = await createEmprestimo(payload);
      
      // Adicionar informações de exibição
      const emprestimoCompleto = {
        ...saved,
        jogo: jogoSelecionado.nome,
        participante: participanteSelecionado.nome,
        horario: saved.horaEmprestimo
      };

      if (emprestimoCompleto.isDevolvido) {
        setHistoricoEmprestimos(prev => [...prev, emprestimoCompleto]);
      } else {
        setEmprestimosAtivos(prev => [...prev, emprestimoCompleto]);
      }
      
      showSuccess('Empréstimo registrado com sucesso!');
      setIsCreateModalOpen(false);
    } catch (e: any) {
      handleError(e, 'Emprestimos - create');
      if (e?.errors) {
        showErrorList(e.errors);
      } else {
        showError(e?.message || 'Erro ao criar empréstimo');
      }
    }
  };

  // Handlers para empréstimos ativos
  const handleExcluirAtivo = useCallback(async (emprestimo: Emprestimo) => {
    if (!window.confirm(`Tem certeza que deseja excluir o empréstimo?\n\nJogo: ${emprestimo.jogo}\nParticipante: ${emprestimo.participante}`)) return;
    
    try {
      await deleteEmprestimo(String(emprestimo.id));
      setEmprestimosAtivos(prevEmprestimos => prevEmprestimos.filter(e => String(e.id) !== String(emprestimo.id)));
      showSuccess('Empréstimo excluído com sucesso!');
    } catch (e: any) {
      handleError(e, 'Emprestimos - delete');
      if (e?.errors) {
        showErrorList(e.errors);
      } else {
        showError(e?.message || 'Erro ao excluir empréstimo');
      }
    }
  }, [showError, showErrorList, showSuccess]);

  const handleDevolver = useCallback(async (emprestimo: Emprestimo) => {
    if (!window.confirm(`${MESSAGES.CONFIRM_RETURN}\n\nJogo: ${emprestimo.jogo}\nParticipante: ${emprestimo.participante}\nHorário: ${emprestimo.horario}`)) return;

    try {
      const horaNow = formatTimeHHMM(new Date());
      const payload = {
        ...emprestimo,
        isDevolvido: true,
        horaDevolucao: horaNow
      };

      const emprestimoAtualizado = await updateEmprestimo(String(emprestimo.id), payload);
      
      // Remove dos ativos e adiciona ao histórico
      setEmprestimosAtivos(prevAtivos => prevAtivos.filter(e => String(e.id) !== String(emprestimo.id)));
      setHistoricoEmprestimos(prevHistorico => [...prevHistorico, emprestimoAtualizado]);
      
      showSuccess('Empréstimo devolvido com sucesso!');
    } catch (e: any) {
      handleError(e, 'Emprestimos - devolver');
      if (e?.errors) {
        showErrorList(e.errors);
      } else {
        showError(e?.message || 'Erro ao devolver empréstimo');
      }
    }
  }, [showError, showErrorList, showSuccess]);

  // Handlers para histórico de empréstimos
  const handleDetalhesHistorico = useCallback((emprestimo: Emprestimo) => {
    setSelectedEmprestimo(emprestimo);
    setIsModalOpen(true);
  }, []);

  const handleEditarHistorico = useCallback((emprestimo: Emprestimo) => {
    setSelectedEmprestimo(emprestimo);
    setIsEditModalOpen(true);
  }, []);

  const handleSalvarEdicao = useCallback(async (emprestimoAtualizado: Emprestimo) => {
    try {
      // Construir payload para API
      const payload = {
        horaEmprestimo: emprestimoAtualizado.horaEmprestimo,
        horaDevolucao: emprestimoAtualizado.horaDevolucao || null,
        isDevolvido: emprestimoAtualizado.isDevolvido
      };

      const saved = await updateEmprestimo(String(emprestimoAtualizado.id), payload);
      
      // Mesclar com dados de exibição
      const emprestimoFinal = {
        ...saved,
        jogo: emprestimoAtualizado.jogo,
        participante: emprestimoAtualizado.participante,
        horario: saved.horaEmprestimo
      };

      // Atualiza no histórico se o empréstimo estiver devolvido
      if (emprestimoFinal.isDevolvido) {
        setHistoricoEmprestimos(prevHistorico => 
          prevHistorico.map(e => e.id === emprestimoFinal.id ? emprestimoFinal : e)
        );
        // Remove dos ativos se estava lá
        setEmprestimosAtivos(prevAtivos => 
          prevAtivos.filter(e => e.id !== emprestimoFinal.id)
        );
      } else {
        // Atualiza nos ativos se não estiver devolvido
        setEmprestimosAtivos(prevAtivos => 
          prevAtivos.map(e => e.id === emprestimoFinal.id ? emprestimoFinal : e)
        );
        // Remove do histórico se estava lá
        setHistoricoEmprestimos(prevHistorico => 
          prevHistorico.filter(e => e.id !== emprestimoFinal.id)
        );
      }
      
      // Atualiza o item selecionado para refletir as mudanças no DetailModal
      setSelectedEmprestimo(emprestimoFinal);
      showSuccess('Empréstimo atualizado com sucesso!');
    } catch (e: any) {
      handleError(e, 'Emprestimos - update');
      if (e?.errors) {
        showErrorList(e.errors);
      } else {
        showError(e?.message || 'Erro ao atualizar empréstimo');
      }
    }
  }, [showError, showErrorList, showSuccess]);

  const handleExcluirHistorico = useCallback(async (emprestimo: Emprestimo) => {
    if (!window.confirm(`Tem certeza que deseja excluir o empréstimo do histórico?\n\nJogo: ${emprestimo.jogo}\nParticipante: ${emprestimo.participante}`)) return;
    
    try {
      await deleteEmprestimo(String(emprestimo.id));
      setHistoricoEmprestimos(prevHistorico => prevHistorico.filter(e => String(e.id) !== String(emprestimo.id)));
      setIsModalOpen(false);
      showSuccess('Empréstimo excluído com sucesso!');
    } catch (e: any) {
      handleError(e, 'Emprestimos - delete histórico');
      if (e?.errors) {
        showErrorList(e.errors);
      } else {
        showError(e?.message || 'Erro ao excluir empréstimo');
      }
    }
  }, [showError, showErrorList, showSuccess]);



  // Ações para empréstimos ativos
  const actionsAtivos: TableAction<Emprestimo>[] = [
    { label: 'Devolver', onClick: handleDevolver, variant: 'primary' },
    { label: 'Excluir', onClick: handleExcluirAtivo, variant: 'danger' }
  ];

  // Ações para histórico de empréstimos
  const actionsHistorico: TableAction<Emprestimo>[] = [
    { label: 'Detalhes', onClick: handleDetalhesHistorico, variant: 'primary' },
    { label: 'Editar', onClick: handleEditarHistorico, variant: 'secondary' },
    { label: 'Excluir', onClick: handleExcluirHistorico, variant: 'danger' }
  ];
  const [activeTab, setActiveTab] = React.useState<'ativos' | 'historico'>('ativos');

  const countAtivos = emprestimosAtivos.length;
  const countHistorico = historicoEmprestimos.length;

  // Campos de criação com lista de jogos e participantes
  const emprestimoCreateFieldsWithOptions: CreateField<Emprestimo>[] = useMemo(() => {
    return emprestimoCreateFields.map(field => {
      if (field.key === 'jogo') {
        return {
          ...field,
          type: 'autocomplete' as const,
          dataListId: 'jogos-list',
          options: jogos.map(jogo => ({
            value: jogo.nome,
            label: jogo.nome,
            searchValue: jogo.codigoDeBarras // Adiciona código de barras para busca
          }))
        };
      }
      if (field.key === 'participante') {
        return {
          ...field,
          type: 'autocomplete' as const,
          dataListId: 'participantes-list',
          options: participantes.map(p => ({
            value: p.nome,
            label: p.nome,
            searchValue: `${p.documento} ${p.ra}` // Adiciona documento e RA para busca
          }))
        };
      }
      return field;
    });
  }, [jogos, participantes]);

  return (
    <div className="page-container">
      <PageHeader 
        title="Gerenciamento de Empréstimos"
        buttonText="Registrar Empréstimo"
        onButtonClick={handleRegistrarEmprestimo}
      />

      {/* Abas */}
      <div className="emp-tabs" role="tablist" aria-label="Abas de Empréstimos">
        <button
          role="tab"
          aria-selected={activeTab === 'ativos'}
          className={`emp-tab ${activeTab === 'ativos' ? 'active' : ''}`}
          onClick={() => setActiveTab('ativos')}
        >
          Empréstimos Ativos <span className="emp-tab-count">{countAtivos}</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'historico'}
          className={`emp-tab ${activeTab === 'historico' ? 'active' : ''}`}
          onClick={() => setActiveTab('historico')}
        >
          Histórico <span className="emp-tab-count">{countHistorico}</span>
        </button>
      </div>

      <div className="emp-tab-panel">
        {activeTab === 'ativos' && (
          <GenericTable<Emprestimo>
            data={emprestimosAtivos}
            columns={EMPRESTIMO_COLUMNS}
            actions={actionsAtivos}
            searchPlaceholder="Buscar empréstimo ativo..."
            searchFields={['jogo', 'participante']}
            tableTitle="Empréstimos Ativos"
          />
        )}

        {activeTab === 'historico' && (
          <GenericTable<Emprestimo>
            data={historicoEmprestimos}
            columns={EMPRESTIMO_DETAIL_COLUMNS}
            actions={actionsHistorico}
            searchPlaceholder="Buscar no histórico..."
            searchFields={['jogo', 'participante']}
            tableTitle="Histórico de Empréstimos"
          />
        )}
      </div>
      
      <DetailModal<Emprestimo>
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedEmprestimo}
        fields={emprestimoDetailFields}
        title="Detalhes do Empréstimo"
        onEdit={handleEditarHistorico}
        onDelete={handleExcluirHistorico}
      />

      <EditModal<Emprestimo>
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSalvarEdicao}
        item={selectedEmprestimo}
        fields={emprestimoEditFields}
        title="Editar Empréstimo"
      />

      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSalvarCriacao}
        fields={emprestimoCreateFieldsWithOptions}
        title="Registrar Novo Empréstimo"
      />
    </div>
  );
};

export default Emprestimos;