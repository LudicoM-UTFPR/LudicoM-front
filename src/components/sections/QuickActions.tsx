import React, { useMemo } from "react";
import { CreateModal, ConsultModal } from "../modals";
import { participanteCreateFields, emprestimoCreateFields } from "../../shared/constants";
import { useCrudOperations, useParticipantes, useJogos, useEventos } from "../../shared/hooks";
import { handleError } from "../../shared/utils";
import { createEmprestimo } from "../../shared/services/emprestimosService";
import type { Participante, Emprestimo } from "../../shared/types";

const QuickActions: React.FC = () => {
    // Hooks para gerenciar modais
    const {
        isCreateModalOpen: isParticipanteModalOpen,
        handleCriar: openParticipanteModal,
        closeCreateModal: closeParticipanteModal
    } = useCrudOperations<Participante>();

    const {
        isCreateModalOpen: isEmprestimoModalOpen,
        handleCriar: openEmprestimoModal,
        closeCreateModal: closeEmprestimoModal
    } = useCrudOperations<Emprestimo>();

    // Hooks para dados das entidades
    const { createParticipante } = useParticipantes();
    const { jogos, loading: jogosLoading, error: jogosError } = useJogos();
    const { eventos } = useEventos();

    // Para modal de consulta de jogos, precisamos de um estado simples
    const [isJogosModalOpen, setIsJogosModalOpen] = React.useState(false);
    const openJogosModal = () => setIsJogosModalOpen(true);
    const closeJogosModal = () => setIsJogosModalOpen(false);

    // Handlers das ações rápidas
    const handleAdicionarParticipante = () => {
        openParticipanteModal();
    };

    const handleConsultarJogo = () => {
        openJogosModal();
    };

    const handleRegistrarEmprestimo = () => {
        openEmprestimoModal();
    };

    // Handlers para salvar dados
    const handleSalvarParticipante = (novoParticipante: Omit<Participante, "id">) => {
        try {
            const participanteCriado = createParticipante(novoParticipante);
            console.log("Participante criado via QuickActions:", participanteCriado);
            closeParticipanteModal();
        } catch (error) {
            handleError(error, "QuickActions - Criar Participante");
        }
    };

    const handleSalvarEmprestimo = async (novoEmprestimo: Omit<Emprestimo, "id">) => {
        try {
            const emprestimoCriado = await createEmprestimo(novoEmprestimo);
            console.log("Empréstimo criado via QuickActions:", emprestimoCriado);
            closeEmprestimoModal();
        } catch (error) {
            handleError(error, "QuickActions - Criar Empréstimo");
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

    return (
        <>
            <section className="acoes-rapidas">
                <h2 className="acoes-title">Ações Rápidas</h2>
                <div className="acoes-buttons">
                    <button className="btn btn--xlarge" onClick={handleAdicionarParticipante}>
                        Adicionar Participante
                    </button>
                    <button className="btn btn--xlarge" onClick={handleConsultarJogo}>
                        Consultar Jogo
                    </button>
                    <button
                        className="btn btn--xlarge"
                        onClick={handleRegistrarEmprestimo}
                    >
                        Registrar Empréstimo
                    </button>
                </div>
            </section>

            {/* Modal para adicionar participante */}
            <CreateModal
                isOpen={isParticipanteModalOpen}
                onClose={closeParticipanteModal}
                onSave={handleSalvarParticipante}
                fields={participanteCreateFields}
                title="Adicionar Novo Participante"
            />

            {/* Modal para consultar jogos */}
            <ConsultModal
                isOpen={isJogosModalOpen}
                onClose={closeJogosModal}
                jogos={jogos}
                loading={jogosLoading}
                error={jogosError}
            />

            {/* Modal para registrar empréstimo */}
            <CreateModal
                isOpen={isEmprestimoModalOpen}
                onClose={closeEmprestimoModal}
                onSave={handleSalvarEmprestimo}
                fields={emprestimoCreateFields}
                title="Registrar Novo Empréstimo"
                infoMessage={eventoAtualInfo}
            />
        </>
    );
};

export default QuickActions;