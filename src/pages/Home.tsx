import React, { useState, useEffect, useCallback } from "react";
import { WelcomeSection, QuickActions, GenericTable } from "../components";
import emprestimosData from '../shared/data/emprestimos.json';
import { handleError, formatTimeHHMM, isoToHHMM, markEmprestimoDevolvidoLocal } from '../shared/utils';
import { MESSAGES, EMPRESTIMO_COLUMNS } from '../shared/constants';
import type { Emprestimo, TableColumn, TableAction } from '../shared/types';

const Home: React.FC = () => {
    const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);

    useEffect(() => {
        try {
            // Validação e carregamento dos dados - filtra apenas não devolvidos
            const validatedData = emprestimosData
                .filter((item) => !item.isDevolvido)
                .map((item): Emprestimo => ({
                    id: Number(item.id),
                    idJogo: Number(item.idJogo),
                    idParticipante: Number(item.idParticipante),
                    idEvento: Number(item.idEvento),
                    // normaliza para HH:mm quando possível
                    horaEmprestimo: item.horaEmprestimo && String(item.horaEmprestimo).includes('T') ? (isoToHHMM(String(item.horaEmprestimo)) || '') : String(item.horaEmprestimo || ''),
                    horaDevolucao: item.horaDevolucao && String(item.horaDevolucao).includes('T') ? isoToHHMM(String(item.horaDevolucao)) : (item.horaDevolucao ? String(item.horaDevolucao) : null),
                    isDevolvido: Boolean(item.isDevolvido),
                    // Campos computados para exibição
                    jogo: String(item.jogo || ""),
                    participante: String(item.participante || ""),
                    horario: String(item.horario || "")
                }));
            setEmprestimos(validatedData);
        } catch (error) {
            handleError(error, "Home - Data Loading");
        }
    }, []);

    const handleDevolver = useCallback((emprestimo: Emprestimo) => {
        if (window.confirm(`${MESSAGES.CONFIRM_RETURN}\n\nJogo: ${emprestimo.jogo}\nParticipante: ${emprestimo.participante}\nHorário: ${emprestimo.horario}`)) {
            const horaNow = formatTimeHHMM(new Date());
            // Marca localmente como devolvido (persistência mock)
            markEmprestimoDevolvidoLocal(emprestimo.id, horaNow);
            // Remove da visualização (marca como devolvido localmente)
            setEmprestimos(prevEmprestimos => prevEmprestimos.filter(e => e.id !== emprestimo.id));
            console.log('Empréstimo devolvido na Home:', emprestimo.id, 'hora:', horaNow);
        }
    }, []);

    const handleExcluir = useCallback((emprestimo: Emprestimo) => {
        if (window.confirm(`Tem certeza que deseja excluir o empréstimo?\n\nJogo: ${emprestimo.jogo}\nParticipante: ${emprestimo.participante}`)) {
            setEmprestimos(prev => prev.filter(e => e.id !== emprestimo.id));
            console.log('Empréstimo excluído na Home:', emprestimo);
        }
    }, []);



    const actions: TableAction<Emprestimo>[] = [
        { label: 'Devolver', onClick: handleDevolver, variant: 'primary' },
        { label: 'Excluir', onClick: handleExcluir, variant: 'danger' }
    ];

    return (
        <>
            <WelcomeSection />
            <QuickActions />
            <GenericTable<Emprestimo>
                data={emprestimos}
                columns={EMPRESTIMO_COLUMNS}
                actions={actions}
                searchPlaceholder="Buscar por jogo ou participante..."
                searchFields={['jogo', 'participante']}
                tableTitle="Empréstimos Ativos"
            />
        </>
    );
};

export default Home;