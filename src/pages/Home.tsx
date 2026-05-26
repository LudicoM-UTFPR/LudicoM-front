import React, { useEffect, useState, useCallback, useMemo } from "react";
import { WelcomeSection, QuickActions, GenericTable, CreateModal } from "../components";
import { ConfirmModal } from "../components/modals/ConfirmModal";
import { useEmprestimos, useJogos, useParticipantes, useEventos } from "../shared/hooks";
import { handleError } from "../shared/utils";
import { MESSAGES, EMPRESTIMO_COLUMNS, emprestimoCreateFields } from "../shared/constants";
import type { Emprestimo, TableAction } from "../shared/types";
import { createEmprestimo, deleteEmprestimo, devolverEmprestimo } from "../shared/services/emprestimosService";
import { useToast } from "../components/common";

const Home: React.FC = () => {
    const { emprestimos, refetchEmprestimos } = useEmprestimos();
    const { jogos, refetchJogos } = useJogos();
    const { participantes } = useParticipantes();
    const { eventos, refetchEventos } = useEventos();
    const { showError, showErrorList, showSuccess } = useToast();
    const [emprestimosAtivos, setEmprestimosAtivos] = useState<Emprestimo[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    // Estados para modal de confirmação de devolução
    const [confirmReturnOpen, setConfirmReturnOpen] = useState(false);
    const [emprestimoParaDevolver, setEmprestimoParaDevolver] = useState<Emprestimo | null>(null);
    // Estados para modal de confirmação de exclusão
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [emprestimoParaExcluir, setEmprestimoParaExcluir] = useState<Emprestimo | null>(null);

    useEffect(() => {
        let isMounted = true;
        async function mapEmprestimos() {
            try {
                // Participantes locais
                let participantesMap = new Map<string, string>();
                participantes.forEach(p => {
                    if (p.id) participantesMap.set(String(p.id), p.nome);
                });

                // Verifica se há algum participante que não está na lista local
                const missingIds = emprestimos
                    .map(emp => String(emp.idParticipante))
                    .filter(id => id && !participantesMap.has(id));

                let fetchedParticipantes: any[] = [];
                if (missingIds.length > 0) {
                    // Busca participantes faltantes via service
                    try {
                        const { fetchParticipantes } = await import("../shared/services/participanteService");
                        fetchedParticipantes = await fetchParticipantes();
                        fetchedParticipantes.forEach(p => {
                            if (p.id) participantesMap.set(String(p.id), p.nome);
                        });
                    } catch (err) {
                        console.error('Falha ao buscar participantes faltantes', err);
                    }
                }

                const emprestimosMapeados = emprestimos.map((emp) => {
                    let participanteNome = emp.participante;
                    if (!participanteNome || participanteNome === "Participante não encontrado") {
                        participanteNome = participantesMap.get(String(emp.idParticipante)) || "Participante não encontrado";
                    }
                    const jogoNome = emp.jogo || jogos.find((j) => String(j.id) === String(emp.idJogo))?.nome || "Jogo não encontrado";
                    return {
                        ...emp,
                        jogo: jogoNome,
                        participante: participanteNome,
                        horario: emp.horaEmprestimo,
                    };
                });
                const ativos = emprestimosMapeados.filter((e) => !e.isDevolvido);
                if (isMounted) setEmprestimosAtivos(ativos);
            } catch (error) {
                handleError(error, "Home - Data Loading");
            }
        }
        mapEmprestimos();
        return () => { isMounted = false; };
    }, [emprestimos, jogos, participantes]);

    const handleRegistrarEmprestimo = useCallback(() => {
        if (refetchEventos) refetchEventos();
        setIsCreateModalOpen(true);
    }, [refetchEventos]);

    const handleSalvarCriacao = async (novoEmprestimo: any) => {
        try {
            const jogoSelecionado = jogos.find((j) => j.nome === novoEmprestimo.jogo);
            const participanteSelecionado = participantes.find((p) => p.nome === novoEmprestimo.participante);

            if (!jogoSelecionado) {
                showError('Jogo não encontrado. Selecione um jogo válido.');
                return;
            }

            if (!participanteSelecionado) {
                showError('Participante não encontrado. Selecione um participante válido.');
                return;
            }

            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            const todayStr = `${year}-${month}-${day}`;
            const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

            const eventoAtual = eventos.find((ev) => {
                if (ev.data !== todayStr) return false;
                const inicio = ev.horaInicio ? String(ev.horaInicio).substring(0, 5) : "";
                const fim = ev.horaFim ? String(ev.horaFim).substring(0, 5) : "";
                return currentTime >= inicio && currentTime <= fim;
            });

            if (!eventoAtual) {
                showError('Nenhum evento ativo no momento. Verifique se existe um evento cadastrado para hoje com horário atual.');
                return;
            }

            const payload = {
                idJogo: String(jogoSelecionado.id),
                idParticipante: String(participanteSelecionado.id),
                idEvento: String(eventoAtual.id),
                horaEmprestimo: novoEmprestimo.horaEmprestimo,
                horaDevolucao: novoEmprestimo.horaDevolucao || null,
                isDevolvido: novoEmprestimo.isDevolvido || false,
                observacoes: novoEmprestimo.observacoes || "",
            };

            await createEmprestimo(payload);

            if (refetchJogos) refetchJogos();
            if (refetchEmprestimos) refetchEmprestimos();

            showSuccess('Empréstimo registrado com sucesso!');
            setIsCreateModalOpen(false);
        } catch (e: any) {
            handleError(e, 'Home - Criar Empréstimo');
            if (e?.errors) {
                showErrorList(e.errors);
            } else {
                showError(e?.message || 'Erro ao criar empréstimo');
            }
        }
    };

    const eventoAtualInfo = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const todayStr = `${year}-${month}-${day}`;
        const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        const eventoAtual = eventos.find((ev) => {
            if (ev.data !== todayStr) return false;
            const inicio = ev.horaInicio ? String(ev.horaInicio).substring(0, 5) : "";
            const fim = ev.horaFim ? String(ev.horaFim).substring(0, 5) : "";
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

        const instituicaoNome = typeof eventoAtual.instituicao === "string"
            ? eventoAtual.instituicao
            : eventoAtual.instituicao?.nome || "Não informada";

        const dataFormatada = new Date(eventoAtual.data + "T00:00:00").toLocaleDateString("pt-BR");

        const [horaFim, minutoFim] = String(eventoAtual.horaFim).substring(0, 5).split(":").map(Number);
        const [horaAtual, minutoAtual] = currentTime.split(":").map(Number);
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
                        marginTop: "0.75rem",
                        padding: "0.75rem",
                        backgroundColor: "#fff9c4",
                        border: "1px solid #fbc02d",
                        borderRadius: "4px",
                        color: "#7f6003"
                    }}>
                        <strong>⚠️ Atenção:</strong> Faltam {minutosAteFim} minutos para o término do evento. Após o término, não será possível registrar novos empréstimos.
                    </div>
                )}
            </div>
        );
    }, [eventos, isCreateModalOpen]);

    // Função para devolver empréstimo
    const handleDevolver = useCallback(async (emprestimo: Emprestimo) => {
        try {
            const jogoObj = jogos.find(j => (emprestimo.idJogo && String(j.id) === String(emprestimo.idJogo)) || j.nome === emprestimo.jogo);
            if (!jogoObj) {
                showError('Jogo não encontrado na lista local.');
                return;
            }
            if (!jogoObj.codigoDeBarras) {
                showError('Jogo sem código de barras cadastrado. Não é possível devolver pela API.');
                return;
            }
            await devolverEmprestimo(String(jogoObj.codigoDeBarras));
            if (refetchJogos) refetchJogos();
            if (refetchEmprestimos) refetchEmprestimos();
            showSuccess('Empréstimo devolvido com sucesso!');
        } catch (e: any) {
            handleError(e, 'Home - devolver');
            if (e?.errors) showErrorList(e.errors); 
            else showError(e?.message || 'Erro ao devolver empréstimo');
        }
    }, [showError, showErrorList, showSuccess, jogos, refetchJogos, refetchEmprestimos]);

    // Abre modal de confirmação de devolução
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

    // Função para excluir empréstimo
    const handleExcluir = useCallback(async (emprestimo: Emprestimo) => {
        try {
            await deleteEmprestimo(String(emprestimo.id));
            setEmprestimosAtivos(prevEmprestimos => prevEmprestimos.filter(e => String(e.id) !== String(emprestimo.id)));
            if (refetchJogos) refetchJogos();
            if (refetchEmprestimos) refetchEmprestimos();
            showSuccess('Empréstimo excluído com sucesso!');
        } catch (e: any) {
            handleError(e, 'Home - delete');
            if (e?.errors) {
                showErrorList(e.errors);
            } else {
                showError(e?.message || 'Erro ao excluir empréstimo');
            }
        }
    }, [showError, showErrorList, showSuccess, refetchJogos, refetchEmprestimos]);

    // Abre modal de confirmação de exclusão
    const askExcluir = useCallback((emprestimo: Emprestimo) => {
        setEmprestimoParaExcluir(emprestimo);
        setConfirmDeleteOpen(true);
    }, []);

    const confirmExcluir = useCallback(async () => {
        if (!emprestimoParaExcluir) return;
        await handleExcluir(emprestimoParaExcluir);
        setConfirmDeleteOpen(false);
        setEmprestimoParaExcluir(null);
    }, [emprestimoParaExcluir, handleExcluir]);

    const actions: TableAction<Emprestimo>[] = [
        { label: "Devolver", onClick: askDevolver, variant: "primary" },
        { label: "Excluir", onClick: askExcluir, variant: "danger" },
    ];

    return (
        <>
            <WelcomeSection />
            <QuickActions onEmprestimoCreated={() => {
                if (refetchEmprestimos) refetchEmprestimos();
                if (refetchJogos) refetchJogos();
            }} />
            <GenericTable<Emprestimo>
                data={emprestimosAtivos}
                columns={EMPRESTIMO_COLUMNS}
                actions={actions}
                searchPlaceholder="Buscar por jogo ou participante..."
                searchFields={["jogo", "participante"]}
                tableTitle="Empréstimos Ativos"
                emptyMessage="Nenhum empréstimo ativo encontrado."
            />
            <CreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleSalvarCriacao}
                fields={emprestimoCreateFields.map((field) => {
                    if (field.key === "jogo") {
                        const jogosDisponiveis = jogos.filter((j) => j.isDisponivel);
                        return {
                            ...field,
                            type: "autocomplete" as const,
                            options: jogosDisponiveis.map((j) => ({
                                value: j.nome,
                                label: `${j.nome}${j.codigoDeBarras ? ` (${j.codigoDeBarras})` : ""}`,
                            })),
                        };
                    }
                    if (field.key === "participante") {
                        return {
                            ...field,
                            type: "autocomplete" as const,
                            options: participantes.map((p) => ({
                                value: p.nome,
                                label: `${p.nome}${p.documento ? ` (${p.documento})` : ""}${p.ra ? ` - RA: ${p.ra}` : ""}`,
                            })),
                        };
                    }
                    return field;
                })}
                title="Registrar Novo Empréstimo"
                infoMessage={eventoAtualInfo}
            />
            
            {/* Modal de confirmação de devolução */}
            <ConfirmModal
                isOpen={confirmReturnOpen}
                title="Devolver Empréstimo"
                message={
                    emprestimoParaDevolver ? (
                        <>
                            Tem certeza que deseja marcar a devolução?<br />
                            <strong>Jogo:</strong> {emprestimoParaDevolver.jogo}<br />
                            <strong>Participante:</strong> {emprestimoParaDevolver.participante}<br />
                            <strong>Horário:</strong> {emprestimoParaDevolver.horario}
                        </>
                    ) : 'Tem certeza que deseja marcar a devolução?'
                }
                confirmLabel="Devolver"
                cancelLabel="Cancelar"
                variant="primary"
                onConfirm={confirmDevolver}
                onCancel={() => { 
                    setConfirmReturnOpen(false); 
                    setEmprestimoParaDevolver(null); 
                }}
            />
            
            {/* Modal de confirmação de exclusão */}
            <ConfirmModal
                isOpen={confirmDeleteOpen}
                title="Excluir Empréstimo"
                message={
                    emprestimoParaExcluir ? (
                        <>
                            Tem certeza que deseja excluir o empréstimo?<br />
                            <strong>Jogo:</strong> {emprestimoParaExcluir.jogo}<br />
                            <strong>Participante:</strong> {emprestimoParaExcluir.participante}<br />
                            <strong>Horário:</strong> {emprestimoParaExcluir.horario}
                        </>
                    ) : 'Tem certeza que deseja excluir o empréstimo?'
                }
                confirmLabel="Excluir"
                cancelLabel="Cancelar"
                variant="danger"
                onConfirm={confirmExcluir}
                onCancel={() => { 
                    setConfirmDeleteOpen(false); 
                    setEmprestimoParaExcluir(null); 
                }}
            />
        </>
    );
};

export default Home;