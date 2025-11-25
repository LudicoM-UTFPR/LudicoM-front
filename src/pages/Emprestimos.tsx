import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { useToast } from '../components/common';
import { emprestimoDetailFields, emprestimoEditFields, emprestimoCreateFields, MESSAGES, EMPRESTIMO_COLUMNS, EMPRESTIMO_DETAIL_COLUMNS } from '../shared/constants';
import { useJogos, useParticipantes, useEventos } from '../shared/hooks';
import { createEmprestimo, updateEmprestimo, deleteEmprestimo, fetchEmprestimos } from '../shared/services/emprestimosService';
import type { CreateField } from '../components/modals/CreateModal';
import { handleError, formatTimeHHMM } from '../shared/utils';
import type { Emprestimo, TableAction } from '../shared/types';

const Emprestimos: React.FC = () => {
  const { jogos } = useJogos();
  const { participantes } = useParticipantes();
  const { eventos } = useEventos();
  const { showErrorList, showError, showSuccess } = useToast();
  const [emprestimosAtivos, setEmprestimosAtivos] = useState<Emprestimo[]>([]);
  const [historicoEmprestimos, setHistoricoEmprestimos] = useState<Emprestimo[]>([]);
  const [selectedEmprestimo, setSelectedEmprestimo] = useState<Emprestimo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    (async () => {
      try {
        const fetched = await fetchEmprestimos(controller.signal);
        // Adiciona campo 'horario' para compatibilidade com tabela
        const withHorario = fetched.map(e => ({ ...e, horario: e.horaEmprestimo }));
        const ativos = withHorario.filter(e => !e.isDevolvido);
        const historico = withHorario.filter(e => e.isDevolvido);
        if (mounted) {
          setEmprestimosAtivos(ativos);
          setHistoricoEmprestimos(historico);
        }
      } catch (error) {
        handleError(error, 'Emprestimos - fetch');
        showError('Erro ao carregar empréstimos');
      }
    })();
    return () => { mounted = false; controller.abort(); };
  }, [showError]);

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

      // Encontrar evento atual (horário está entre horaInicio e horaFim hoje)
      const now = new Date();
      // Usar data local ao invés de UTC
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const eventoAtual = eventos.find(ev => {
        if (ev.data !== todayStr) return false;
        const inicio = ev.horaInicio ? String(ev.horaInicio).substring(0, 5) : '';
        const fim = ev.horaFim ? String(ev.horaFim).substring(0, 5) : '';
        return currentTime >= inicio && currentTime <= fim;
      });

      if (!eventoAtual) {
        showError('Nenhum evento ativo no momento. Verifique se existe um evento cadastrado para hoje com horário atual.');
        return;
      }

      // Construir payload para API usando IDs reais (uid)
      const payload = {
        idJogo: String(jogoSelecionado.id),
        idParticipante: String(participanteSelecionado.id),
        idEvento: String(eventoAtual.id),
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
        // Filtra apenas jogos disponíveis
        const jogosDisponiveis = jogos.filter(jogo => jogo.isDisponivel);
        return {
          ...field,
          type: 'autocomplete' as const,
          dataListId: 'jogos-list',
          options: jogosDisponiveis.map(jogo => ({
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

  // Calcular evento atual
  const eventoAtualInfo = useMemo(() => {
    const now = new Date();
    // Usar data local ao invés de UTC
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const eventoAtual = eventos.find(ev => {
      if (ev.data !== todayStr) return false;
      const inicio = ev.horaInicio ? String(ev.horaInicio).substring(0, 5) : '';
      const fim = ev.horaFim ? String(ev.horaFim).substring(0, 5) : '';
      return currentTime >= inicio && currentTime <= fim;
    });

    if (!eventoAtual) {
      return (
        <div>
          <strong>⚠️ Atenção:</strong> Nenhum evento ativo no momento.<br />
          Verifique se existe um evento cadastrado para hoje com horário atual.
        </div>
      );
    }

    const instituicaoNome = typeof eventoAtual.instituicao === 'string' 
      ? eventoAtual.instituicao 
      : eventoAtual.instituicao?.nome || 'Não informada';

    const dataFormatada = new Date(eventoAtual.data + 'T00:00:00').toLocaleDateString('pt-BR');

    return (
      <div>
        <strong>📍 Evento Atual:</strong><br />
        <strong>Local:</strong> {instituicaoNome}<br />
        <strong>Data:</strong> {dataFormatada}<br />
        <strong>Horário:</strong> {eventoAtual.horaInicio} - {eventoAtual.horaFim}
      </div>
    );
  }, [eventos]);

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
        infoMessage={eventoAtualInfo}
      />
    </div>
  );
};

export default Emprestimos;