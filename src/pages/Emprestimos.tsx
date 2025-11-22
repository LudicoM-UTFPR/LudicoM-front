import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, GenericTable, DetailModal, EditModal, CreateModal } from '../components';
import { emprestimoDetailFields, emprestimoEditFields, emprestimoCreateFields, MESSAGES, EMPRESTIMO_COLUMNS, EMPRESTIMO_DETAIL_COLUMNS } from '../shared/constants';
import emprestimosData from '../shared/data/emprestimos.json';
import { handleError, formatTimeHHMM, isoToHHMM, getDevolvidosLocal, generateId } from '../shared/utils';
import type { Emprestimo, TableAction } from '../shared/types';

const Emprestimos: React.FC = () => {
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

  const handleSalvarCriacao = (novoEmprestimo: any) => {
    const emprestimoComId = {
      ...novoEmprestimo,
      id: generateId('emprestimo'),
      status: 'Ativo'
    };
    setEmprestimosAtivos([...emprestimosAtivos, emprestimoComId]);
    setIsCreateModalOpen(false);
  };

  // Handlers para empréstimos ativos
  const handleExcluirAtivo = useCallback((emprestimo: Emprestimo) => {
    if (window.confirm(`Tem certeza que deseja excluir o empréstimo?\n\nJogo: ${emprestimo.jogo}\nParticipante: ${emprestimo.participante}`)) {
      setEmprestimosAtivos(prevEmprestimos => prevEmprestimos.filter(e => String(e.id) !== String(emprestimo.id)));
      console.log('Empréstimo ativo excluído:', emprestimo);
    }
  }, []);

  const handleDevolver = useCallback((emprestimo: Emprestimo) => {
    if (window.confirm(`${MESSAGES.CONFIRM_RETURN}\n\nJogo: ${emprestimo.jogo}\nParticipante: ${emprestimo.participante}\nHorário: ${emprestimo.horario}`)) {
      // Remove dos ativos e adiciona ao histórico
      const horaNow = formatTimeHHMM(new Date());
      const emprestimoDevolvido = { ...emprestimo, isDevolvido: true, horaDevolucao: horaNow };

      setEmprestimosAtivos(prevAtivos => prevAtivos.filter(e => String(e.id) !== String(emprestimo.id)));
      setHistoricoEmprestimos(prevHistorico => [...prevHistorico, emprestimoDevolvido]);
      
      console.log('Empréstimo devolvido:', emprestimo.id, 'em:', new Date().toISOString());
    }
  }, []);

  // Handlers para histórico de empréstimos
  const handleDetalhesHistorico = useCallback((emprestimo: Emprestimo) => {
    setSelectedEmprestimo(emprestimo);
    setIsModalOpen(true);
  }, []);

  const handleEditarHistorico = useCallback((emprestimo: Emprestimo) => {
    setSelectedEmprestimo(emprestimo);
    setIsEditModalOpen(true);
  }, []);

  const handleSalvarEdicao = useCallback((emprestimoAtualizado: Emprestimo) => {
    // Atualiza no histórico se o empréstimo estiver devolvido
    if (emprestimoAtualizado.isDevolvido) {
      setHistoricoEmprestimos(prevHistorico => 
        prevHistorico.map(e => e.id === emprestimoAtualizado.id ? emprestimoAtualizado : e)
      );
    } else {
      // Atualiza nos ativos se não estiver devolvido
      setEmprestimosAtivos(prevAtivos => 
        prevAtivos.map(e => e.id === emprestimoAtualizado.id ? emprestimoAtualizado : e)
      );
    }
    // Atualiza o item selecionado para refletir as mudanças no DetailModal
    setSelectedEmprestimo(emprestimoAtualizado);
    console.log('Empréstimo atualizado:', emprestimoAtualizado);
  }, []);

  const handleExcluirHistorico = useCallback((emprestimo: Emprestimo) => {
    if (window.confirm(`Tem certeza que deseja excluir o empréstimo do histórico?\n\nJogo: ${emprestimo.jogo}\nParticipante: ${emprestimo.participante}`)) {
      setHistoricoEmprestimos(prevHistorico => prevHistorico.filter(e => String(e.id) !== String(emprestimo.id)));
      setIsModalOpen(false); // Fecha o modal após exclusão
      console.log('Empréstimo do histórico excluído:', emprestimo);
    }
  }, []);



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
        fields={emprestimoCreateFields}
        title="Registrar Novo Empréstimo"
      />
    </div>
  );
};

export default Emprestimos;