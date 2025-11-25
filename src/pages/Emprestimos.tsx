import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { useToast } from '../components/common';
import { emprestimoDetailFields, emprestimoEditFields, emprestimoCreateFields, MESSAGES, EMPRESTIMO_COLUMNS, EMPRESTIMO_DETAIL_COLUMNS } from '../shared/constants';
import { useJogos, useParticipantes, useEventos } from '../shared/hooks';
import { createEmprestimo, updateEmprestimo, deleteEmprestimo, fetchEmprestimos, devolverEmprestimo } from '../shared/services/emprestimosService';
import type { CreateField } from '../components/modals/CreateModal';
import { handleError, formatTimeHHMM } from '../shared/utils';
import type { Emprestimo, TableAction } from '../shared/types';

const Emprestimos: React.FC = () => {
  const { jogos, updateJogo, setDisponibilidadeLocal, refetchJogos } = useJogos();
  const { participantes } = useParticipantes();
  const { eventos } = useEventos();
  const { showErrorList, showError, showSuccess } = useToast();
  const [emprestimosAtivos, setEmprestimosAtivos] = useState<Emprestimo[]>([]);
  const [historicoEmprestimos, setHistoricoEmprestimos] = useState<Emprestimo[]>([]);
  const [selectedEmprestimo, setSelectedEmprestimo] = useState<Emprestimo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    (async () => {
      const fetched = await fetchEmprestimos(controller.signal);

      // Serviço já normaliza nomes; garante fallback às listas locais se vierem vazios.
      const emprestimosMapeados = fetched.map(emp => {
        const jogoNome = emp.jogo || jogos.find(j => String(j.id) === String(emp.idJogo))?.nome || 'Jogo não encontrado';
        const participanteNome = emp.participante || participantes.find(p => String(p.id) === String(emp.idParticipante))?.nome || 'Participante não encontrado';
        return {
          ...emp,
          jogo: jogoNome,
          participante: participanteNome,
          horario: emp.horaEmprestimo,
        } as Emprestimo;
      });
      
      const ativos = emprestimosMapeados.filter(e => !e.isDevolvido);
      const historico = emprestimosMapeados.filter(e => e.isDevolvido);
      if (mounted) {
        setEmprestimosAtivos(ativos);
        setHistoricoEmprestimos(historico);
      }
    })();
    return () => { mounted = false; controller.abort(); };
  }, [jogos, participantes]);

  const handleRegistrarEmprestimo = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleRegistrarDevolucao = useCallback(() => {
    setIsReturnModalOpen(true);
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

      // Marca o jogo como indisponível imediatamente (fallback local se remoto falhar)
      if (updateJogo) {
        try {
          const updated = await updateJogo(String(jogoSelecionado.id), { isDisponivel: false });
          // Se backend não retornou alteração, força local
          if (updated && updated.isDisponivel) {
            setDisponibilidadeLocal(String(jogoSelecionado.id), false);
          }
        } catch (e) {
          handleError(e, 'Emprestimos - marcar jogo indisponível (remoto falhou, aplicando local)');
          setDisponibilidadeLocal(String(jogoSelecionado.id), false);
        }
      } else {
        setDisponibilidadeLocal(String(jogoSelecionado.id), false);
      }
      
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

      // Verifica se existem outros empréstimos ativos para o mesmo jogo ANTES de remover
      const jogoIdRef = String(emprestimo.idJogo || '');
      const existeOutroAtivoMesmoJogo = emprestimosAtivos.some(e => e.id !== emprestimo.id && !e.isDevolvido && (
        (jogoIdRef && String(e.idJogo || '') === jogoIdRef) || e.jogo === emprestimo.jogo
      ));

      setEmprestimosAtivos(prevEmprestimos => prevEmprestimos.filter(e => String(e.id) !== String(emprestimo.id)));

      // Se não houver outro empréstimo ativo do mesmo jogo, marca disponibilidade novamente
      if (!existeOutroAtivoMesmoJogo) {
        const jogoObj = jogos.find(j => (jogoIdRef && String(j.id) === jogoIdRef) || j.nome === emprestimo.jogo);
        if (jogoObj) {
          if (updateJogo) {
            updateJogo(String(jogoObj.id), { isDisponivel: true })
              .catch(() => setDisponibilidadeLocal(String(jogoObj.id), true));
          } else {
            setDisponibilidadeLocal(String(jogoObj.id), true);
          }
        }
      }

      // Recarrega jogos para atualizar disponibilidade
      if (refetchJogos) refetchJogos();

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

  // Modal de devolução manual via código de barras
  const handleSalvarDevolucao = useCallback(async (form: any) => {
    try {
      const jogoSelecionado = jogos.find(j => j.nome === form.jogo);
      if (!jogoSelecionado) {
        showError('Jogo não encontrado. Selecione um jogo válido.');
        return;
      }
      if (!jogoSelecionado.codigoDeBarras) {
        showError('Jogo sem código de barras cadastrado.');
        return;
      }

      // Chama API de devolução
      let remotoAtualizado: Emprestimo | null = null;
      try {
        remotoAtualizado = await devolverEmprestimo(String(jogoSelecionado.codigoDeBarras));
      } catch (e: any) {
        handleError(e, 'Emprestimos - devolver manual');
        if (e?.errors) showErrorList(e.errors); else showError(e?.message || 'Erro ao devolver empréstimo');
        return;
      }

      // Localiza empréstimo ativo correspondente
      const jogoIdRef = String(jogoSelecionado.id);
      const emprestimoAtivo = emprestimosAtivos.find(e => (e.idJogo && String(e.idJogo) === jogoIdRef) || e.jogo === jogoSelecionado.nome);
      if (!emprestimoAtivo) {
        showError('Não há empréstimo ativo para este jogo.');
        return;
      }

      const horaNow = formatTimeHHMM(new Date());
      const emprestimoAtualizado: Emprestimo = remotoAtualizado ? {
        ...emprestimoAtivo,
        ...remotoAtualizado,
        isDevolvido: true,
        horaDevolucao: remotoAtualizado.horaDevolucao || horaNow,
        horario: emprestimoAtivo.horario
      } : {
        ...emprestimoAtivo,
        isDevolvido: true,
        horaDevolucao: horaNow
      };

      // Atualiza listas
      setEmprestimosAtivos(prev => prev.filter(e => e.id !== emprestimoAtivo.id));
      setHistoricoEmprestimos(prev => [...prev, emprestimoAtualizado]);

      // Marca jogo disponível
      if (updateJogo) {
        updateJogo(String(jogoSelecionado.id), { isDisponivel: true })
          .catch(() => setDisponibilidadeLocal(String(jogoSelecionado.id), true));
      } else {
        setDisponibilidadeLocal(String(jogoSelecionado.id), true);
      }

      if (refetchJogos) refetchJogos();

      showSuccess('Devolução registrada com sucesso!');
      setIsReturnModalOpen(false);
    } catch (e: any) {
      handleError(e, 'Emprestimos - salvar devolucao manual');
      if (e?.errors) showErrorList(e.errors); else showError(e?.message || 'Erro ao registrar devolução');
    }
  }, [jogos, emprestimosAtivos, updateJogo, setDisponibilidadeLocal, refetchJogos, showError, showErrorList, showSuccess]);

  const handleDevolver = useCallback(async (emprestimo: Emprestimo) => {
    if (!window.confirm(`${MESSAGES.CONFIRM_RETURN}\n\nJogo: ${emprestimo.jogo}\nParticipante: ${emprestimo.participante}\nHorário: ${emprestimo.horario}`)) return;

    try {
      // Localiza jogo para obter código de barras
      const jogoObj = jogos.find(j => (emprestimo.idJogo && String(j.id) === String(emprestimo.idJogo)) || j.nome === emprestimo.jogo);
      if (!jogoObj) {
        showError('Jogo não encontrado na lista local.');
        return;
      }
      if (!jogoObj.codigoDeBarras) {
        showError('Jogo sem código de barras cadastrado. Não é possível devolver pela API.');
        return;
      }

      // Chama endpoint específico de devolução via código de barras
      let remotoAtualizado: Emprestimo | null = null;
      try {
        remotoAtualizado = await devolverEmprestimo(String(jogoObj.codigoDeBarras));
      } catch (err: any) {
        if (err?.errors) showErrorList(err.errors); else showError(err?.message || 'Erro ao devolver empréstimo');
        return; // Aborta fluxo se API falha
      }

      const horaNow = formatTimeHHMM(new Date());
      const emprestimoAtualizado: Emprestimo = remotoAtualizado ? {
        ...emprestimo,
        ...remotoAtualizado,
        isDevolvido: true,
        horaDevolucao: remotoAtualizado.horaDevolucao || horaNow,
        horario: emprestimo.horario
      } : {
        ...emprestimo,
        isDevolvido: true,
        horaDevolucao: horaNow
      };

      // Verifica se existem outros empréstimos ativos para o mesmo jogo ANTES de remover
      const jogoIdRef = String(emprestimo.idJogo || '');
      const existeOutroAtivoMesmoJogo = emprestimosAtivos.some(e => e.id !== emprestimo.id && !e.isDevolvido && (
        (jogoIdRef && String(e.idJogo || '') === jogoIdRef) || e.jogo === emprestimo.jogo
      ));

      // Move dos ativos para histórico
      setEmprestimosAtivos(prevAtivos => prevAtivos.filter(e => String(e.id) !== String(emprestimo.id)));
      setHistoricoEmprestimos(prevHistorico => [...prevHistorico, emprestimoAtualizado]);

      // Se não houver outro empréstimo ativo do mesmo jogo, marca disponibilidade novamente
      if (!existeOutroAtivoMesmoJogo) {
        if (updateJogo) {
          updateJogo(String(jogoObj.id), { isDisponivel: true })
            .catch(() => setDisponibilidadeLocal(String(jogoObj.id), true));
        } else {
          setDisponibilidadeLocal(String(jogoObj.id), true);
        }
      }

      // Recarrega jogos para atualizar disponibilidade
      if (refetchJogos) refetchJogos();

      showSuccess('Empréstimo devolvido com sucesso!');
    } catch (e: any) {
      handleError(e, 'Emprestimos - devolver (novo endpoint)');
      if (e?.errors) showErrorList(e.errors); else showError(e?.message || 'Erro ao devolver empréstimo');
    }
  }, [showError, showErrorList, showSuccess, jogos, emprestimosAtivos, updateJogo, setDisponibilidadeLocal, refetchJogos]);

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
        const jogosDisponiveis = jogos.filter(j => j.isDisponivel);
        return {
          ...field,
          type: 'autocomplete' as const,
          dataListId: 'jogos-list',
          options: jogosDisponiveis.map(j => ({
            value: j.nome,
            label: j.nome
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
            label: p.nome
          }))
        };
      }
      return field;
    });
  }, [jogos, participantes, isCreateModalOpen]);

  // Campos para modal de devolução (lista de jogos atualmente emprestados)
  const emprestimoReturnFields: CreateField<any>[] = useMemo(() => {
    const fieldBase = {
      key: 'jogo',
      label: 'Jogo',
      type: 'autocomplete' as const,
      required: true,
      placeholder: 'Selecione o jogo emprestado...'
    };
    const jogosEmprestados = emprestimosAtivos.map(e => e.jogo);
    const options = jogos.filter(j => jogosEmprestados.includes(j.nome)).map(j => ({
      value: j.nome,
      label: j.nome
    }));
    return [ { ...fieldBase, options } ];
  }, [emprestimosAtivos, jogos, isReturnModalOpen]);

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
      <div className="page-actions" style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem' }}>
        <button
          type="button"
          className="btn btn--medium btn--secondary"
          onClick={handleRegistrarDevolucao}
        >
          Registrar Devolução
        </button>
      </div>

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
          <>
            <GenericTable<Emprestimo>
              data={emprestimosAtivos}
              columns={EMPRESTIMO_COLUMNS}
              actions={actionsAtivos}
              searchPlaceholder="Buscar empréstimo ativo..."
              searchFields={['jogo', 'participante']}
              tableTitle="Empréstimos Ativos"
            />
            {emprestimosAtivos.length === 0 && (
              <p className="empty-message" role="status">Nenhum empréstimo encontrado.</p>
            )}
          </>
        )}

        {activeTab === 'historico' && (
          <>
            <GenericTable<Emprestimo>
              data={historicoEmprestimos}
              columns={EMPRESTIMO_DETAIL_COLUMNS}
              actions={actionsHistorico}
              searchPlaceholder="Buscar no histórico..."
              searchFields={['jogo', 'participante']}
              tableTitle="Histórico de Empréstimos"
            />
            {historicoEmprestimos.length === 0 && (
              <p className="empty-message" role="status">Nenhum empréstimo encontrado.</p>
            )}
          </>
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
      <CreateModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onSave={handleSalvarDevolucao}
        fields={emprestimoReturnFields}
        title="Registrar Devolução"
      />
    </div>
  );
};

export default Emprestimos;