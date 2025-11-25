import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { useToast } from '../components/common';
import { emprestimoDetailFields, emprestimoEditFields, emprestimoCreateFields, MESSAGES, EMPRESTIMO_COLUMNS, EMPRESTIMO_DETAIL_COLUMNS } from '../shared/constants';
import { useJogos, useParticipantes, useEventos, useEmprestimos } from '../shared/hooks';
import { createEmprestimo, updateEmprestimo, deleteEmprestimo, devolverEmprestimo } from '../shared/services/emprestimosService';
import type { CreateField } from '../components/modals/CreateModal';
import type { EditField } from '../components/modals/EditModal';
import { handleError, formatTimeHHMM } from '../shared/utils';
import type { Emprestimo, TableAction } from '../shared/types';

const Emprestimos: React.FC = () => {
  const { jogos, refetchJogos } = useJogos();
  const { participantes } = useParticipantes();
  const { eventos, refetchEventos } = useEventos();
  const { emprestimos, refetchEmprestimos } = useEmprestimos();
  const { showErrorList, showError, showSuccess } = useToast();
  const [emprestimosAtivos, setEmprestimosAtivos] = useState<Emprestimo[]>([]);
  const [historicoEmprestimos, setHistoricoEmprestimos] = useState<Emprestimo[]>([]);
  const [selectedEmprestimo, setSelectedEmprestimo] = useState<Emprestimo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // Processa empréstimos do hook para separar ativos e histórico
  useEffect(() => {
    // Serviço já normaliza nomes; garante fallback às listas locais se vierem vazios.
    const emprestimosMapeados = emprestimos.map(emp => {
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
    
    setEmprestimosAtivos(ativos);
    setHistoricoEmprestimos(historico);
  }, [emprestimos, jogos, participantes]);

  const handleRegistrarEmprestimo = useCallback(() => {
    // Recarrega eventos para garantir dados atualizados
    if (refetchEventos) refetchEventos();
    setIsCreateModalOpen(true);
  }, [refetchEventos]);

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

      // Backend já marca o jogo como indisponível automaticamente
      // Apenas recarrega a lista de jogos para refletir a mudança
      if (refetchJogos) refetchJogos();
      
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
      
      // Atualiza cache de empréstimos
      if (refetchEmprestimos) refetchEmprestimos();
      
      showSuccess('Empréstimo registrado com sucesso!');
      setIsCreateModalOpen(false); // Fecha apenas em caso de sucesso
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

      // Backend já atualiza a disponibilidade do jogo automaticamente
      // Apenas recarrega as listas para refletir as mudanças
      if (refetchJogos) refetchJogos();
      if (refetchEmprestimos) refetchEmprestimos();

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

      // Backend processa toda a lógica: encontra empréstimo ativo, atualiza horaDevolucao,
      // marca isDevolvido=true e atualiza disponibilidade do jogo
      await devolverEmprestimo(String(jogoSelecionado.codigoDeBarras));

      // Recarrega caches para refletir mudanças do backend
      if (refetchJogos) refetchJogos();
      if (refetchEmprestimos) refetchEmprestimos();

      showSuccess('Devolução registrada com sucesso!');
      setIsReturnModalOpen(false);
    } catch (e: any) {
      handleError(e, 'Emprestimos - salvar devolucao manual');
      if (e?.errors) showErrorList(e.errors); else showError(e?.message || 'Erro ao registrar devolução');
    }
  }, [jogos, refetchJogos, refetchEmprestimos, showError, showErrorList, showSuccess]);

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

      // Backend processa toda a lógica: encontra empréstimo ativo, atualiza horaDevolucao,
      // marca isDevolvido=true e atualiza disponibilidade do jogo
      await devolverEmprestimo(String(jogoObj.codigoDeBarras));

      // Recarrega caches para refletir mudanças do backend
      if (refetchJogos) refetchJogos();
      if (refetchEmprestimos) refetchEmprestimos();

      showSuccess('Empréstimo devolvido com sucesso!');
    } catch (e: any) {
      handleError(e, 'Emprestimos - devolver (novo endpoint)');
      if (e?.errors) showErrorList(e.errors); else showError(e?.message || 'Erro ao devolver empréstimo');
    }
  }, [showError, showErrorList, showSuccess, jogos, refetchJogos, refetchEmprestimos]);

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
      // Encontrar jogo e participante pelos nomes para pegar os IDs
      const jogoSelecionado = jogos.find(j => j.nome === emprestimoAtualizado.jogo);
      const participanteSelecionado = participantes.find(p => p.nome === emprestimoAtualizado.participante);

      if (!jogoSelecionado) {
        showError('Jogo não encontrado. Selecione um jogo válido.');
        return;
      }

      if (!participanteSelecionado) {
        showError('Participante não encontrado. Selecione um participante válido.');
        return;
      }

      // Encontrar evento atual (o mesmo que foi usado na criação)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const eventoAtual = eventos.find(ev => {
        const evData = String(ev.data).startsWith(todayStr) || String(ev.data) === todayStr;
        const inicioOk = !ev.horaInicio || currentTime >= String(ev.horaInicio).substring(0, 5);
        const fimOk = !ev.horaFim || currentTime <= String(ev.horaFim).substring(0, 5);
        return evData && inicioOk && fimOk;
      });

      if (!eventoAtual) {
        showError('Nenhum evento ativo encontrado para o horário atual.');
        return;
      }

      // Construir payload para API com IDs
      const payload = {
        idJogo: jogoSelecionado.id,
        idParticipante: participanteSelecionado.id,
        idEvento: eventoAtual.id,
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
      
      // Atualiza cache de empréstimos
      if (refetchEmprestimos) refetchEmprestimos();
      
      showSuccess('Empréstimo atualizado com sucesso!');
      setIsEditModalOpen(false); // Fecha apenas em caso de sucesso
    } catch (e: any) {
      handleError(e, 'Emprestimos - update');
      if (e?.errors) {
        showErrorList(e.errors);
      } else {
        showError(e?.message || 'Erro ao atualizar empréstimo');
      }
    }
  }, [jogos, participantes, eventos, showError, showErrorList, showSuccess]);

  const handleExcluirHistorico = useCallback(async (emprestimo: Emprestimo) => {
    if (!window.confirm(`Tem certeza que deseja excluir o empréstimo do histórico?\n\nJogo: ${emprestimo.jogo}\nParticipante: ${emprestimo.participante}`)) return;
    
    try {
      await deleteEmprestimo(String(emprestimo.id));
      setHistoricoEmprestimos(prevHistorico => prevHistorico.filter(e => String(e.id) !== String(emprestimo.id)));
      
      // Atualiza cache de empréstimos
      if (refetchEmprestimos) refetchEmprestimos();
      
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
            label: `${j.nome}${j.codigoDeBarras ? ` (${j.codigoDeBarras})` : ''}`
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
            label: `${p.nome}${p.documento ? ` (${p.documento})` : ''}${p.ra ? ` - RA: ${p.ra}` : ''}`
          }))
        };
      }
      return field;
    });
  }, [jogos, participantes, isCreateModalOpen]);

  // Campos de edição com lista de jogos e participantes
  const emprestimoEditFieldsWithOptions: EditField<Emprestimo>[] = useMemo(() => {
    return emprestimoEditFields.map(field => {
      if (field.key === 'jogo') {
        return {
          ...field,
          options: jogos.map(j => ({
            value: j.nome,
            label: `${j.nome}${j.codigoDeBarras ? ` (${j.codigoDeBarras})` : ''}`
          }))
        };
      }
      if (field.key === 'participante') {
        return {
          ...field,
          options: participantes.map(p => ({
            value: p.nome,
            label: `${p.nome}${p.documento ? ` (${p.documento})` : ''}${p.ra ? ` - RA: ${p.ra}` : ''}`
          }))
        };
      }
      return field;
    });
  }, [jogos, participantes, isEditModalOpen]);

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

    // Verificar se falta 30 minutos ou menos para o fim do evento
    const [horaFim, minutoFim] = String(eventoAtual.horaFim).substring(0, 5).split(':').map(Number);
    const [horaAtual, minutoAtual] = currentTime.split(':').map(Number);
    const minutosAteFim = (horaFim * 60 + minutoFim) - (horaAtual * 60 + minutoAtual);
    const mostrarAviso = minutosAteFim <= 30 && minutosAteFim > 0;

    return (
      <div>
        <strong>📍 Evento Atual:</strong><br />
        <strong>Local:</strong> {instituicaoNome}<br />
        <strong>Data:</strong> {dataFormatada}<br />
        <strong>Horário:</strong> {eventoAtual.horaInicio} - {eventoAtual.horaFim}
        {mostrarAviso && (
          <div style={{ 
            marginTop: '0.75rem', 
            padding: '0.75rem', 
            backgroundColor: '#fff9c4', 
            border: '1px solid #fbc02d',
            borderRadius: '4px',
            color: '#7f6003'
          }}>
            <strong>⚠️ Atenção:</strong> Faltam {minutosAteFim} minutos para o término do evento. Após o término, não será possível registrar novos empréstimos.
          </div>
        )}
      </div>
    );
  }, [eventos, isCreateModalOpen]);

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
        fields={emprestimoEditFieldsWithOptions}
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