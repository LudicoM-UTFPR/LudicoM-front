import React, { useEffect, useState, useCallback, useMemo } from "react";
import { WelcomeSection, QuickActions, GenericTable, CreateModal } from "../components";
import { useEmprestimos, useJogos, useParticipantes, useEventos } from "../shared/hooks";
import { handleError } from "../shared/utils";
import { MESSAGES, EMPRESTIMO_COLUMNS, emprestimoCreateFields } from "../shared/constants";
import type { Emprestimo, TableAction } from "../shared/types";
import { createEmprestimo } from "../shared/services/emprestimosService";
import { useToast } from "../components/common";

const Home: React.FC = () => {
    const { emprestimos, refetchEmprestimos } = useEmprestimos();
    const { jogos, refetchJogos } = useJogos();
    const { participantes } = useParticipantes();
    const { eventos, refetchEventos } = useEventos();
    const { showError, showErrorList, showSuccess } = useToast();
    const [emprestimosAtivos, setEmprestimosAtivos] = useState<Emprestimo[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
                        // Se falhar, ignora e segue com os locais
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

    const actions: TableAction<Emprestimo>[] = [
        { label: "Devolver", onClick: () => {}, variant: "primary" },
        { label: "Excluir", onClick: () => {}, variant: "danger" },
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
        </>
    );
};

export default Home;