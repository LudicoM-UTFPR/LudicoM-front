import React from "react";
import { CreateModal, ConsultModal } from "../modals";
import { participanteCreateFields, emprestimoCreateFields } from "../../shared/constants";
import { useCrudOperations, useParticipantes, useJogos, useEmprestimos } from "../../shared/hooks";
import { handleError } from "../../shared/utils";
import type { Participante, Emprestimo } from "../../shared/types";

const QuickActions: React.FC = () => {
    // Hooks para gerenciar modais
    const {
        isCreateModalOpen: isParticipanteModalOpen,
        handleCriar: openParticipanteModal,
        closeCreateModal: closeParticipanteModal
    } = useCrudOperations<Participante>();

    // Para modal de consulta de jogos, precisamos de um estado simples
    const [isJogosModalOpen, setIsJogosModalOpen] = React.useState(false);
    const openJogosModal = () => setIsJogosModalOpen(true);
    const closeJogosModal = () => setIsJogosModalOpen(false);

    const {
        isCreateModalOpen: isEmprestimoModalOpen,
        handleCriar: openEmprestimoModal,
        closeCreateModal: closeEmprestimoModal
    } = useCrudOperations<Emprestimo>();

    // Hooks para dados das entidades
    const { createParticipante } = useParticipantes();
    const { jogos, loading: jogosLoading, error: jogosError } = useJogos();
    const { createEmprestimo } = useEmprestimos();

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
    const handleSalvarParticipante = (novoParticipante: Omit<Participante, 'id'>) => {
        try {
            const participanteCriado = createParticipante(novoParticipante);
            console.log('Participante criado via QuickActions:', participanteCriado);
            closeParticipanteModal();
        } catch (error) {
            handleError(error, 'QuickActions - Criar Participante');
        }
    };

    const handleSalvarEmprestimo = (novoEmprestimo: Omit<Emprestimo, 'id'>) => {
        try {
            const emprestimoCriado = createEmprestimo(novoEmprestimo);
            console.log('Empréstimo criado via QuickActions:', emprestimoCriado);
            closeEmprestimoModal();
        } catch (error) {
            handleError(error, 'QuickActions - Criar Empréstimo');
        }
    };

    return (
        <>
            <section className="acoes-rapidas">
                <h2 className="acoes-title">Ações Rápidas</h2>
                <div className="acoes-buttons">
                    <button className="btn btn--xlarge btn--primary" onClick={handleAdicionarParticipante}>
                        Adicionar Participante
                    </button>
                    <button className="btn btn--xlarge btn--primary" onClick={handleConsultarJogo}>
                        Consultar Jogo
                    </button>
                    <button
                        className="btn btn--xlarge btn--primary"
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
            />
        </>
    );
};

export default QuickActions;