import React, { useEffect, useState, useCallback, useMemo } from "react";
import { WelcomeSection, QuickActions, GenericTable, CreateModal } from "../components";
import { useEmprestimos, useJogos, useParticipantes, useEventos } from "../shared/hooks";
import { handleError } from "../shared/utils";
import { MESSAGES, EMPRESTIMO_COLUMNS, emprestimoCreateFields } from "../shared/constants";
import type { Emprestimo, TableAction } from "../shared/types";

const Home: React.FC = () => {
    const { emprestimos, refetchEmprestimos } = useEmprestimos();
    const { jogos, refetchJogos } = useJogos();
    const { participantes } = useParticipantes();
    const { eventos, refetchEventos } = useEventos();
    const [emprestimosAtivos, setEmprestimosAtivos] = useState<Emprestimo[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        try {
            const emprestimosMapeados = emprestimos.map((emp) => {
                const jogoNome = emp.jogo || jogos.find((j) => String(j.id) === String(emp.idJogo))?.nome || "Jogo não encontrado";
                const participanteNome = emp.participante || participantes.find((p) => String(p.id) === String(emp.idParticipante))?.nome || "Participante não encontrado";
                return {
                    ...emp,
                    jogo: jogoNome,
                    participante: participanteNome,
                    horario: emp.horaEmprestimo,
                };
            });

            const ativos = emprestimosMapeados.filter((e) => !e.isDevolvido);
            setEmprestimosAtivos(ativos);
        } catch (error) {
            handleError(error, "Home - Data Loading");
        }
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
                alert("Jogo não encontrado. Selecione um jogo válido.");
                return;
            }

            if (!participanteSelecionado) {
                alert("Participante não encontrado. Selecione um participante válido.");
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
                alert("Nenhum evento ativo no momento. Verifique se existe um evento cadastrado para hoje com horário atual.");
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

            console.log("Payload de criação de empréstimo:", payload);

            if (refetchJogos) refetchJogos();
            if (refetchEmprestimos) refetchEmprestimos();

            setIsCreateModalOpen(false);
        } catch (error) {
            console.error("Erro ao registrar empréstimo:", error);
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

        return null;
    }, [eventos]);

    const actions: TableAction<Emprestimo>[] = [
        { label: "Devolver", onClick: () => {}, variant: "primary" },
        { label: "Excluir", onClick: () => {}, variant: "danger" },
    ];

    return (
        <>
            <WelcomeSection />
            <QuickActions />
            <GenericTable<Emprestimo>
                data={emprestimosAtivos}
                columns={EMPRESTIMO_COLUMNS}
                actions={actions}
                searchPlaceholder="Buscar por jogo ou participante..."
                searchFields={["jogo", "participante"]}
                tableTitle="Empréstimos Ativos"
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