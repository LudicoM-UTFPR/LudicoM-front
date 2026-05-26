import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal, Pagination } from '../components';
import { ConfirmModal } from '../components/modals/ConfirmModal';
import { useToast } from '../components/common';
import { emprestimoDetailFields, emprestimoEditFields, emprestimoCreateFields, MESSAGES, EMPRESTIMO_COLUMNS, EMPRESTIMO_DETAIL_COLUMNS } from '../shared/constants';
import { participanteCreateFields, instituicaoCreateFields } from '../shared/constants/createFields';
import { useJogos, useParticipantes, useEventos, useInstituicoes } from '../shared/hooks';
import { fetchEmprestimosPaginated, createEmprestimo, updateEmprestimo, deleteEmprestimo, devolverEmprestimo } from '../shared/services/emprestimosService';
import type { CreateField } from '../components/modals/CreateModal';
import type { EditField } from '../components/modals/EditModal';
import { handleError, formatTimeHHMM } from '../shared/utils';
import type { Emprestimo, TableAction, Instituicao } from '../shared/types';

const Emprestimos: React.FC = () => {
  const { jogos, refetchJogos } = useJogos();
  const { participantes, createParticipante: createParticipanteHook } = useParticipantes();
  const { eventos, refetchEventos } = useEventos();
  const { instituicoes } = useInstituicoes();
  const { showErrorList, showError, showSuccess } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [emprestimoParaExcluir, setEmprestimoParaExcluir] = useState<Emprestimo | null>(null);
  const [deleteContext, setDeleteContext] = useState<'ativo' | 'historico'>('ativo');
  const [confirmReturnOpen, setConfirmReturnOpen] = useState(false);
  const [emprestimoParaDevolver, setEmprestimoParaDevolver] = useState<Emprestimo | null>(null);
  const [showCreateParticipante, setShowCreateParticipante] = useState(false);
  const [newParticipanteNamePrefill, setNewParticipanteNamePrefill] = useState<string>('');
  const [selectedEmprestimo, setSelectedEmprestimo] = useState<Emprestimo | null>(null);
  const [activeTab, setActiveTab] = useState<'ativos' | 'historico'>('ativos');

  const [data, setData] = useState<Emprestimo[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRegistrarEmprestimo = useCallback(() => {
    if (refetchEventos) refetchEventos();
    setIsCreateModalOpen(true);
  }, [refetchEventos]);

  const handleRegistrarDevolucao = useCallback(() => {
    setIsReturnModalOpen(true);
  }, []);

  const fetchPage = useCallback(async (p: number, search: string, size: number, isDevolvido: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchEmprestimosPaginated(p, size, isDevolvido, search || undefined);
      setData(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      setPage(result.number);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setError('Erro ao carregar empréstimos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchText);
      if (searchText !== debouncedSearch) setPage(0);
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchText]);

  useEffect(() => {
    fetchPage(page, debouncedSearch, pageSize, activeTab === 'ativos');
  }, [page, debouncedSearch, pageSize, activeTab, fetchPage]);

  const handleSearchChange = useCallback((value: string) => setSearchText(value), []);
  const handlePageSizeChange = useCallback((size: number) => { setPageSize(size); setPage(0); }, []);

  const refetchCurrentPage = useCallback(() => {
    fetchPage(page, debouncedSearch, pageSize, activeTab === 'ativos');
  }, [page, debouncedSearch, pageSize, activeTab, fetchPage]);

  const handleTabChange = useCallback((tab: 'ativos' | 'historico') => {
    setActiveTab(tab);
    setPage(0);
    setSearchText('');
    setDebouncedSearch('');
  }, []);

  const handleSalvarCriacao = async (novoEmprestimo: any) => {
    try {
      const jogoSelecionado = jogos.find(j => j.nome === novoEmprestimo.jogo);
      const participanteSelecionado = participantes.find(p => p.nome === novoEmprestimo.participante);
      if (!jogoSelecionado) { showError('Jogo não encontrado. Selecione um jogo válido.'); return; }
      if (!participanteSelecionado) { showError('Participante não encontrado. Selecione um participante válido.'); return; }
      const now = new Date();
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
      if (!eventoAtual) { showError('Nenhum evento ativo no momento. Verifique se existe um evento cadastrado para hoje com horário atual.'); return; }
      const payload = { idJogo: String(jogoSelecionado.id), idParticipante: String(participanteSelecionado.id), idEvento: String(eventoAtual.id), horaEmprestimo: novoEmprestimo.horaEmprestimo, horaDevolucao: novoEmprestimo.horaDevolucao || null, isDevolvido: novoEmprestimo.isDevolvido || false, observacoes: novoEmprestimo.observacoes || '' };
      const saved = await createEmprestimo(payload);
      if (refetchJogos) refetchJogos();
      setData(prev => saved.isDevolvido ? prev : [...prev, { ...saved, jogo: jogoSelecionado.nome, participante: participanteSelecionado.nome, horario: saved.horaEmprestimo }]);
      showSuccess('Empréstimo registrado com sucesso!');
      setIsCreateModalOpen(false);
    } catch (e: any) {
      handleError(e, 'Emprestimos - create');
      if (e?.errors) { showErrorList(e.errors); } else { showError(e?.message || 'Erro ao criar empréstimo'); }
    }
  };

  const handleExcluirAtivo = useCallback(async (emprestimo: Emprestimo) => {
    try {
      await deleteEmprestimo(String(emprestimo.id));
      if (refetchJogos) refetchJogos();
      showSuccess('Empréstimo excluído com sucesso!');
      refetchCurrentPage();
    } catch (e: any) {
      handleError(e, 'Emprestimos - delete');
      if (e?.errors) { showErrorList(e.errors); } else { showError(e?.message || 'Erro ao excluir empréstimo'); }
    }
  }, [refetchJogos, showError, showErrorList, showSuccess, refetchCurrentPage]);

  const handleSalvarDevolucao = useCallback(async (form: any) => {
    try {
      const jogoSelecionado = jogos.find(j => j.nome === form.jogo);
      if (!jogoSelecionado) { showError('Jogo não encontrado. Selecione um jogo válido.'); return; }
      if (!jogoSelecionado.codigoDeBarras) { showError('Jogo sem código de barras cadastrado.'); return; }
      await devolverEmprestimo(String(jogoSelecionado.codigoDeBarras));
      if (refetchJogos) refetchJogos();
      showSuccess('Devolução registrada com sucesso!');
      setIsReturnModalOpen(false);
      refetchCurrentPage();
    } catch (e: any) {
      handleError(e, 'Emprestimos - salvar devolucao manual');
      if (e?.errors) showErrorList(e.errors); else showError(e?.message || 'Erro ao registrar devolução');
    }
  }, [jogos, refetchJogos, showError, showErrorList, showSuccess, refetchCurrentPage]);

  const handleDevolver = useCallback(async (emprestimo: Emprestimo) => {
    try {
      const jogoObj = jogos.find(j => (emprestimo.idJogo && String(j.id) === String(emprestimo.idJogo)) || j.nome === emprestimo.jogo);
      if (!jogoObj) { showError('Jogo não encontrado na lista local.'); return; }
      if (!jogoObj.codigoDeBarras) { showError('Jogo sem código de barras cadastrado. Não é possível devolver pela API.'); return; }
      await devolverEmprestimo(String(jogoObj.codigoDeBarras));
      if (refetchJogos) refetchJogos();
      showSuccess('Empréstimo devolvido com sucesso!');
      refetchCurrentPage();
    } catch (e: any) {
      handleError(e, 'Emprestimos - devolver');
      if (e?.errors) showErrorList(e.errors); else showError(e?.message || 'Erro ao devolver empréstimo');
    }
  }, [showError, showErrorList, showSuccess, jogos, refetchJogos, refetchCurrentPage]);

  const askDevolver = useCallback((emprestimo: Emprestimo) => {
    setEmprestimoParaDevolver(emprestimo);
    setConfirmReturnOpen(true);
  }, []);

  const confirmDevolver = useCallback(async () => {
    if (!emprestimoParaDevolver) return;
    await handleDevolver(emprestimoParaDevolver);
    setConfirmReturnOpen(false);
    setEmprestimoParaDevolver(null);
  }, [emprestimoParaDevolver, handleDevolver]);

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
      const jogoSelecionado = jogos.find(j => j.nome === emprestimoAtualizado.jogo);
      const participanteSelecionado = participantes.find(p => p.nome === emprestimoAtualizado.participante);
      if (!jogoSelecionado) { showError('Jogo não encontrado. Selecione um jogo válido.'); return; }
      if (!participanteSelecionado) { showError('Participante não encontrado. Selecione um participante válido.'); return; }
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
      if (!eventoAtual) { showError('Nenhum evento ativo encontrado para o horário atual.'); return; }
      const payload = { idJogo: jogoSelecionado.id, idParticipante: participanteSelecionado.id, idEvento: eventoAtual.id, horaEmprestimo: emprestimoAtualizado.horaEmprestimo, horaDevolucao: emprestimoAtualizado.horaDevolucao || null, isDevolvido: emprestimoAtualizado.isDevolvido };
      const saved = await updateEmprestimo(String(emprestimoAtualizado.id), payload);
      const emprestimoFinal = { ...saved, jogo: emprestimoAtualizado.jogo, participante: emprestimoAtualizado.participante, horario: saved.horaEmprestimo };
      setSelectedEmprestimo(emprestimoFinal);
      showSuccess('Empréstimo atualizado com sucesso!');
      setIsEditModalOpen(false);
      refetchCurrentPage();
    } catch (e: any) {
      handleError(e, 'Emprestimos - update');
      if (e?.errors) { showErrorList(e.errors); } else { showError(e?.message || 'Erro ao atualizar empréstimo'); }
    }
  }, [jogos, participantes, eventos, showError, showErrorList, showSuccess, refetchCurrentPage]);

  const handleExcluirHistorico = useCallback(async (emprestimo: Emprestimo) => {
    try {
      await deleteEmprestimo(String(emprestimo.id));
      setIsModalOpen(false);
      showSuccess('Empréstimo excluído com sucesso!');
      refetchCurrentPage();
    } catch (e: any) {
      handleError(e, 'Emprestimos - delete histórico');
      if (e?.errors) { showErrorList(e.errors); } else { showError(e?.message || 'Erro ao excluir empréstimo'); }
    }
  }, [showError, showErrorList, showSuccess, refetchCurrentPage]);

  const askExcluirAtivo = useCallback((emprestimo: Emprestimo) => {
    setDeleteContext('ativo');
    setEmprestimoParaExcluir(emprestimo);
    setConfirmOpen(true);
  }, []);

  const askExcluirHistorico = useCallback((emprestimo: Emprestimo) => {
    setDeleteContext('historico');
    setEmprestimoParaExcluir(emprestimo);
    setConfirmOpen(true);
  }, []);

  const confirmExcluir = useCallback(async () => {
    if (!emprestimoParaExcluir) return;
    if (deleteContext === 'ativo') {
      await handleExcluirAtivo(emprestimoParaExcluir);
    } else {
      await handleExcluirHistorico(emprestimoParaExcluir);
    }
    setConfirmOpen(false);
    setEmprestimoParaExcluir(null);
  }, [emprestimoParaExcluir, deleteContext, handleExcluirAtivo, handleExcluirHistorico]);

  const handleSalvarNovoParticipante = async (novo: any) => {
    try {
      let instituicaoObj: Instituicao | undefined;
      if (novo.instituicao) {
        instituicaoObj = instituicoes.find((i: Instituicao) => i.nome === novo.instituicao);
      }
      if (instituicaoObj && !novo.ra) { showError('RA é obrigatório quando instituição é informada.'); return; }
      const errors: Record<string, string> = {};
      if (novo.email && participantes.some(p => p.email === novo.email)) errors.email = 'Email já cadastrado.';
      if (novo.documento && participantes.some(p => p.documento === novo.documento)) errors.documento = 'Documento já cadastrado.';
      if (novo.ra && participantes.some(p => p.ra === novo.ra)) errors.ra = 'RA já cadastrado.';
      if (Object.keys(errors).length) { showErrorList(errors); return; }
      const payload: any = { nome: novo.nome, email: novo.email, documento: novo.documento, ra: novo.ra || '', idInstituicao: instituicaoObj ? instituicaoObj.uid : undefined };
      const saved = await createParticipanteHook(payload);
      setShowCreateParticipante(false);
      setNewParticipanteNamePrefill(saved.nome);
      showSuccess('Participante criado com sucesso!');
    } catch (e: any) {
      handleError(e, 'Emprestimos - criar participante inline');
      if (e?.status === 409) {
        if (e?.errors) showErrorList(e.errors, 'warning'); else showError(e?.message || 'Conflito ao criar participante.');
      } else if (e?.errors) { showErrorList(e.errors); } else { showError(e?.message || 'Erro ao criar participante.'); }
    }
  };

  const actionsAtivos: TableAction<Emprestimo>[] = [
    { label: 'Devolver', onClick: askDevolver, variant: 'primary' },
    { label: 'Excluir', onClick: askExcluirAtivo, variant: 'danger' }
  ];

  const actionsHistorico: TableAction<Emprestimo>[] = [
    { label: 'Detalhes', onClick: handleDetalhesHistorico, variant: 'primary' },
    { label: 'Editar', onClick: handleEditarHistorico, variant: 'secondary' },
    { label: 'Excluir', onClick: askExcluirHistorico, variant: 'danger' }
  ];

  const countAtivos = activeTab === 'ativos' ? totalElements : 0;
  const countHistorico = activeTab === 'historico' ? totalElements : 0;

  const participanteCreateFieldsWithOptions = useMemo(() => {
    return participanteCreateFields.map((f: any) => f.key === 'instituicao' ? {
      ...f, options: instituicoes.map((i: Instituicao) => ({ value: i.nome, label: i.nome }))
    } : f);
  }, [instituicoes, showCreateParticipante]);

  const emprestimoCreateFieldsWithOptions: CreateField<Emprestimo>[] = useMemo(() => {
    return emprestimoCreateFields.map(field => {
      if (field.key === 'jogo') {
        const jogosDisponiveis = jogos.filter(j => j.isDisponivel);
        return { ...field, type: 'autocomplete' as const, dataListId: 'jogos-list', options: jogosDisponiveis.map(j => ({ value: j.nome, label: `${j.nome}${j.codigoDeBarras ? ` (${j.codigoDeBarras})` : ''}` })) };
      }
      if (field.key === 'participante') {
        return { ...field, type: 'autocomplete' as const, dataListId: 'participantes-list', options: participantes.map(p => ({ value: p.nome, label: `${p.nome}${p.documento ? ` (${p.documento})` : ''}${p.ra ? ` - RA: ${p.ra}` : ''}` })) };
      }
      return field;
    });
  }, [jogos, participantes, isCreateModalOpen]);

  const emprestimoEditFieldsWithOptions: EditField<Emprestimo>[] = useMemo(() => {
    return emprestimoEditFields.map(field => {
      if (field.key === 'jogo') {
        return { ...field, options: jogos.map(j => ({ value: j.nome, label: `${j.nome}${j.codigoDeBarras ? ` (${j.codigoDeBarras})` : ''}` })) };
      }
      if (field.key === 'participante') {
        return { ...field, options: participantes.map(p => ({ value: p.nome, label: `${p.nome}${p.documento ? ` (${p.documento})` : ''}${p.ra ? ` - RA: ${p.ra}` : ''}` })) };
      }
      return field;
    });
  }, [jogos, participantes, isEditModalOpen]);

  const emprestimoReturnFields: CreateField<any>[] = useMemo(() => {
    const fieldBase = { key: 'jogo', label: 'Jogo', type: 'autocomplete' as const, required: true, placeholder: 'Busque pelo nome ou código de barras do jogo...' };
    const options = jogos.filter(j => !j.isDisponivel).map(j => ({
      value: j.nome, label: `${j.nome}${j.codigoDeBarras ? ` (${j.codigoDeBarras})` : ''}`
    }));
    return [ { ...fieldBase, options } ];
  }, [jogos, isReturnModalOpen]);

  const eventoAtualInfo = useMemo(() => {
    const now = new Date();
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
      return (<div><strong>⚠️ Atenção:</strong> Nenhum evento ativo no momento.<br />Verifique se existe um evento cadastrado para hoje com horário atual.</div>);
    }
    const instituicaoNome = typeof eventoAtual.instituicao === 'string' ? eventoAtual.instituicao : eventoAtual.instituicao?.nome || 'Não informada';
    const dataFormatada = new Date(eventoAtual.data + 'T00:00:00').toLocaleDateString('pt-BR');
    const [horaFim, minutoFim] = String(eventoAtual.horaFim).substring(0, 5).split(':').map(Number);
    const [horaAtual, minutoAtual] = currentTime.split(':').map(Number);
    const minutosAteFim = (horaFim * 60 + minutoFim) - (horaAtual * 60 + minutoAtual);
    const mostrarAviso = minutosAteFim <= 30 && minutosAteFim > 0;
    return (<div>
      <strong>📍 Evento Atual:</strong><br />
      <strong>Local:</strong> {instituicaoNome}<br />
      <strong>Data:</strong> {dataFormatada}<br />
      <strong>Horário:</strong> {eventoAtual.horaInicio} - {eventoAtual.horaFim}
      {mostrarAviso && (<div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#fff9c4', border: '1px solid #fbc02d', borderRadius: '4px', color: '#7f6003' }}>
        <strong>⚠️ Atenção:</strong> Faltam {minutosAteFim} minutos para o término do evento. Após o término, não será possível registrar novos empréstimos.
      </div>)}
    </div>);
  }, [eventos, isCreateModalOpen]);

  return (
    <div className="page-container">
      <PageHeader title="Gerenciamento de Empréstimos" showButton={false} />
      <section style={{ marginBottom: '24px', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div className="acoes-buttons">
          <button type="button" className="btn btn--xlarge" onClick={handleRegistrarEmprestimo}>Registrar Empréstimo</button>
          <button type="button" className="btn btn--xlarge" onClick={handleRegistrarDevolucao}>Registrar Devolução</button>
        </div>
      </section>

      <div className="emp-tabs" role="tablist" aria-label="Abas de Empréstimos">
        <button role="tab" aria-selected={activeTab === 'ativos'} className={`emp-tab ${activeTab === 'ativos' ? 'active' : ''}`} onClick={() => handleTabChange('ativos')}>
          Empréstimos Ativos <span className="emp-tab-count">{countAtivos}</span>
        </button>
        <button role="tab" aria-selected={activeTab === 'historico'} className={`emp-tab ${activeTab === 'historico' ? 'active' : ''}`} onClick={() => handleTabChange('historico')}>
          Histórico <span className="emp-tab-count">{countHistorico}</span>
        </button>
      </div>

      <div className="emp-tab-panel">
        {loading && data.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Carregando...</div>}
        {error && data.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--btn-danger)' }}>{error}</div>}
        {(data.length > 0 || !loading) && (
          <div style={{ opacity: loading && data.length > 0 ? 0.5 : 1, transition: 'opacity 0.15s ease' }}>
            <GenericTable<Emprestimo>
              data={data}
              columns={activeTab === 'ativos' ? EMPRESTIMO_COLUMNS : EMPRESTIMO_DETAIL_COLUMNS}
              actions={activeTab === 'ativos' ? actionsAtivos : actionsHistorico}
              searchPlaceholder={activeTab === 'ativos' ? 'Buscar empréstimo ativo...' : 'Buscar no histórico...'}
              searchFields={['jogo', 'participante']}
              tableTitle={activeTab === 'ativos' ? 'Empréstimos Ativos' : 'Histórico de Empréstimos'}
              emptyMessage={activeTab === 'ativos' ? 'Nenhum empréstimo ativo encontrado.' : 'Nenhum empréstimo no histórico.'}
              controlledSearchValue={searchText}
              onControlledSearchChange={handleSearchChange}
            />
            <Pagination
              page={page} totalPages={totalPages} totalElements={totalElements}
              pageSize={pageSize} onPageChange={setPage} onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>

      <DetailModal<Emprestimo>
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} item={selectedEmprestimo}
        fields={emprestimoDetailFields} title="Detalhes do Empréstimo"
        onEdit={handleEditarHistorico} onDelete={askExcluirHistorico}
      />
      <EditModal<Emprestimo>
        isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSalvarEdicao}
        item={selectedEmprestimo} fields={emprestimoEditFieldsWithOptions} title="Editar Empréstimo"
      />
      <CreateModal
        isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={handleSalvarCriacao}
        fields={emprestimoCreateFieldsWithOptions} title="Registrar Novo Empréstimo" infoMessage={eventoAtualInfo}
        inlineFieldActions={{ participante: { label: '+', title: 'Criar novo participante', onClick: () => setShowCreateParticipante(true) } }}
        prefill={newParticipanteNamePrefill ? { participante: newParticipanteNamePrefill } as any : undefined}
      />
      <CreateModal
        isOpen={isReturnModalOpen} onClose={() => setIsReturnModalOpen(false)} onSave={handleSalvarDevolucao}
        fields={emprestimoReturnFields} title="Registrar Devolução"
      />
      <CreateModal
        isOpen={showCreateParticipante} onClose={() => setShowCreateParticipante(false)}
        onSave={handleSalvarNovoParticipante as any} fields={participanteCreateFieldsWithOptions as any} title="Criar Participante"
      />
      <ConfirmModal
        isOpen={confirmReturnOpen} title="Devolver Empréstimo"
        message={emprestimoParaDevolver ? (<>
          Tem certeza que deseja marcar a devolução?<br />
          <strong>Jogo:</strong> {emprestimoParaDevolver.jogo}<br />
          <strong>Participante:</strong> {emprestimoParaDevolver.participante}<br />
          <strong>Horário:</strong> {emprestimoParaDevolver.horario}
        </>) : 'Tem certeza que deseja marcar a devolução?'}
        confirmLabel="Devolver" cancelLabel="Cancelar" variant="primary"
        onConfirm={confirmDevolver}
        onCancel={() => { setConfirmReturnOpen(false); setEmprestimoParaDevolver(null); }}
      />
      <ConfirmModal
        isOpen={confirmOpen} title={deleteContext === 'historico' ? 'Excluir Empréstimo do Histórico' : 'Excluir Empréstimo'}
        message={emprestimoParaExcluir ? (<>
          Tem certeza que deseja excluir o empréstimo?<br />
          <strong>Jogo:</strong> {emprestimoParaExcluir.jogo}<br />
          <strong>Participante:</strong> {emprestimoParaExcluir.participante}<br />
          {deleteContext === 'ativo' && (<><strong>Horário:</strong> {emprestimoParaExcluir.horario}</>)}
        </>) : 'Tem certeza que deseja excluir o empréstimo?'}
        confirmLabel="Excluir" cancelLabel="Cancelar" variant="danger"
        onConfirm={confirmExcluir}
        onCancel={() => { setConfirmOpen(false); setEmprestimoParaExcluir(null); }}
      />
    </div>
  );
};

export default Emprestimos;
