import React, { useMemo } from "react";
import { CreateModal, ConsultModal } from "../modals";
import { participanteCreateFields, emprestimoCreateFields, instituicaoCreateFields } from "../../shared/constants";
import { useCrudOperations, useParticipantes, useJogos, useEventos, useInstituicoes } from "../../shared/hooks";
import { handleError } from "../../shared/utils";
import { createEmprestimo } from "../../shared/services/emprestimosService";
import type { Participante, Emprestimo, Instituicao } from "../../shared/types";
import { useToast } from "../common";

type QuickActionsProps = {
    onEmprestimoCreated?: () => void;
};

const QuickActions: React.FC<QuickActionsProps> = ({ onEmprestimoCreated }) => {
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
    const { createParticipante, participantes } = useParticipantes();
    const { jogos, loading: jogosLoading, error: jogosError } = useJogos();
    const { eventos } = useEventos();
    const { instituicoes, createInstituicao } = useInstituicoes();
    const { showError, showErrorList, showSuccess, showWarning } = useToast();

    // Para modal de consulta de jogos, precisamos de um estado simples
    const [isJogosModalOpen, setIsJogosModalOpen] = React.useState(false);
    const openJogosModal = () => setIsJogosModalOpen(true);
    const closeJogosModal = () => setIsJogosModalOpen(false);

    // Estados para modal de criar participante inline (a partir do modal de empréstimo)
    const [showCreateParticipanteInline, setShowCreateParticipanteInline] = React.useState(false);
    const [newParticipanteNamePrefill, setNewParticipanteNamePrefill] = React.useState<string>("");

    // Estados para modal de criar instituição inline (a partir do modal de participante inline)
    const [showCreateInstituicaoInline, setShowCreateInstituicaoInline] = React.useState(false);
    const [newInstituicaoNamePrefill, setNewInstituicaoNamePrefill] = React.useState<string>("");

    // Estados para modal de criar instituição inline (a partir do modal principal de participante)
    const [showCreateInstituicaoFromParticipante, setShowCreateInstituicaoFromParticipante] = React.useState(false);
    const [newInstituicaoNameFromParticipante, setNewInstituicaoNameFromParticipante] = React.useState<string>("");

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

    // Handler para salvar participante (modal principal de adicionar participante)
    const handleSalvarParticipante = async (novo: any) => {
        try {
            // Resolve instituição se fornecida
            let instituicaoObj: Instituicao | undefined = undefined;
            if (novo.instituicao) {
                instituicaoObj = instituicoes.find((i: Instituicao) => i.nome === novo.instituicao);
            }
            // Validação condicional RA
            if (instituicaoObj && !novo.ra) {
                showError('RA é obrigatório quando instituição é informada.');
                return;
            }
            // Validação de unicidade
            const errors: Record<string, string> = {};
            if (novo.email && participantes.some(p => p.email === novo.email)) {
                errors.email = 'Email já cadastrado.';
            }
            if (novo.documento && participantes.some(p => p.documento === novo.documento)) {
                errors.documento = 'Documento já cadastrado.';
            }
            if (novo.ra && participantes.some(p => p.ra === novo.ra)) {
                errors.ra = 'RA já cadastrado.';
            }
            if (Object.keys(errors).length) {
                showErrorList(errors);
                return;
            }

            const payload: any = {
                nome: novo.nome,
                email: novo.email,
                documento: novo.documento,
                ra: novo.ra || '',
                idInstituicao: instituicaoObj ? instituicaoObj.uid : undefined
            };

            const participanteCriado = await createParticipante(payload);
            showSuccess('Participante criado com sucesso!');
            closeParticipanteModal();
        } catch (e: any) {
            handleError(e, 'QuickActions - Criar Participante');
            if (e?.status === 409) {
                if (e?.errors) showErrorList(e.errors, 'warning');
                else showWarning(e?.message || 'Conflito ao criar participante.');
            } else if (e?.errors) {
                showErrorList(e.errors);
            } else {
                showError(e?.message || 'Erro ao criar participante.');
            }
        }
    };

    // Handler para salvar instituição inline (a partir do modal principal de participante)
    const handleSalvarInstituicaoFromParticipante = async (nova: any) => {
        if (!createInstituicao) return;
        try {
            const saved = await createInstituicao({ nome: nova.nome, endereco: nova.endereco || '' });
            setShowCreateInstituicaoFromParticipante(false);
            setNewInstituicaoNameFromParticipante(saved.nome);
            showSuccess('Instituição criada com sucesso!');
        } catch (e: any) {
            if (e?.status === 409) {
                if (e?.errors) showErrorList(e.errors, 'warning');
                else showWarning(e?.message || 'Conflito ao criar instituição.');
            } else if (e?.errors) {
                showErrorList(e.errors);
            } else {
                showError(e?.message || 'Erro ao criar instituição.');
            }
        }
    };

    const handleSalvarEmprestimo = async (novoEmprestimo: any) => {
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
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            const eventoAtual = eventos.find((ev) => {
                if (ev.data !== todayStr) return false;
                const inicio = ev.horaInicio ? String(ev.horaInicio).substring(0, 5) : '';
                const fim = ev.horaFim ? String(ev.horaFim).substring(0, 5) : '';
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
                observacoes: novoEmprestimo.observacoes || ''
            };

            await createEmprestimo(payload);
            // Notifica sucesso e fecha modal
            showSuccess('Empréstimo registrado com sucesso!');
            closeEmprestimoModal();
            // Solicita ao pai que recarregue a lista
            if (onEmprestimoCreated) {
                onEmprestimoCreated();
            }
        } catch (e: any) {
            handleError(e, 'QuickActions - Criar Empréstimo');
            if (e?.errors) {
                showErrorList(e.errors);
            } else {
                showError(e?.message || 'Erro ao criar empréstimo');
            }
        }
    };

    // Handler para salvar participante inline (a partir do modal de empréstimo)
    const handleSalvarParticipanteInline = async (novo: any) => {
        try {
            // Resolve instituição se fornecida
            let instituicaoObj: Instituicao | undefined = undefined;
            if (novo.instituicao) {
                instituicaoObj = instituicoes.find((i: Instituicao) => i.nome === novo.instituicao);
            }
            // Validação condicional RA
            if (instituicaoObj && !novo.ra) {
                showError('RA é obrigatório quando instituição é informada.');
                return;
            }
            // Validação de unicidade
            const errors: Record<string, string> = {};
            if (novo.email && participantes.some(p => p.email === novo.email)) {
                errors.email = 'Email já cadastrado.';
            }
            if (novo.documento && participantes.some(p => p.documento === novo.documento)) {
                errors.documento = 'Documento já cadastrado.';
            }
            if (novo.ra && participantes.some(p => p.ra === novo.ra)) {
                errors.ra = 'RA já cadastrado.';
            }
            if (Object.keys(errors).length) {
                showErrorList(errors);
                return;
            }

            const payload: any = {
                nome: novo.nome,
                email: novo.email,
                documento: novo.documento,
                ra: novo.ra || '',
                idInstituicao: instituicaoObj ? instituicaoObj.uid : undefined
            };

            const participanteCriado = await createParticipante(payload);
            setShowCreateParticipanteInline(false);
            setNewParticipanteNamePrefill(participanteCriado.nome);
            showSuccess('Participante criado com sucesso!');
        } catch (e: any) {
            handleError(e, 'QuickActions - Criar Participante Inline');
            if (e?.status === 409) {
                if (e?.errors) showErrorList(e.errors, 'warning');
                else showWarning(e?.message || 'Conflito ao criar participante.');
            } else if (e?.errors) {
                showErrorList(e.errors);
            } else {
                showError(e?.message || 'Erro ao criar participante.');
            }
        }
    };

    // Handler para salvar instituição inline (a partir do modal de participante inline)
    const handleSalvarInstituicaoInline = async (nova: any) => {
        if (!createInstituicao) return;
        try {
            const saved = await createInstituicao({ nome: nova.nome, endereco: nova.endereco || '' });
            setShowCreateInstituicaoInline(false);
            setNewInstituicaoNamePrefill(saved.nome);
            showSuccess('Instituição criada com sucesso!');
        } catch (e: any) {
            if (e?.status === 409) {
                if (e?.errors) showErrorList(e.errors, 'warning');
                else showWarning(e?.message || 'Conflito ao criar instituição.');
            } else if (e?.errors) {
                showErrorList(e.errors);
            } else {
                showError(e?.message || 'Erro ao criar instituição.');
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
                fields={participanteCreateFields.map(f => f.key === 'instituicao' ? {
                    ...f,
                    options: instituicoes.map((i: Instituicao) => ({ value: i.nome, label: i.nome }))
                } : f)}
                inlineFieldActions={{
                    instituicao: {
                        label: '+',
                        title: 'Criar nova instituição',
                        onClick: () => setShowCreateInstituicaoFromParticipante(true)
                    }
                }}
                prefill={newInstituicaoNameFromParticipante ? { instituicao: newInstituicaoNameFromParticipante } as any : undefined}
                title="Adicionar Novo Participante"
            />

            {/* Modal para criar instituição inline (a partir do modal principal de participante) */}
            <CreateModal
                isOpen={showCreateInstituicaoFromParticipante}
                onClose={() => setShowCreateInstituicaoFromParticipante(false)}
                onSave={handleSalvarInstituicaoFromParticipante as any}
                fields={instituicaoCreateFields as any}
                title="Criar Instituição"
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
                fields={
                    emprestimoCreateFields.map((field) => {
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
                    })
                }
                title="Registrar Novo Empréstimo"
                infoMessage={eventoAtualInfo}
                inlineFieldActions={{
                    participante: {
                        label: '+',
                        title: 'Criar novo participante',
                        onClick: () => setShowCreateParticipanteInline(true)
                    }
                }}
                prefill={newParticipanteNamePrefill ? { participante: newParticipanteNamePrefill } as any : undefined}
            />

            {/* Modal para criar participante inline (a partir do modal de empréstimo) */}
            <CreateModal
                isOpen={showCreateParticipanteInline}
                onClose={() => setShowCreateParticipanteInline(false)}
                onSave={handleSalvarParticipanteInline}
                fields={participanteCreateFields.map(f => f.key === 'instituicao' ? {
                    ...f,
                    options: instituicoes.map((i: Instituicao) => ({ value: i.nome, label: i.nome }))
                } : f)}
                inlineFieldActions={{
                    instituicao: {
                        label: '+',
                        title: 'Criar nova instituição',
                        onClick: () => setShowCreateInstituicaoInline(true)
                    }
                }}
                prefill={newInstituicaoNamePrefill ? { instituicao: newInstituicaoNamePrefill } as any : undefined}
                title="Criar Participante"
            />

            {/* Modal para criar instituição inline (a partir do modal de participante inline) */}
            <CreateModal
                isOpen={showCreateInstituicaoInline}
                onClose={() => setShowCreateInstituicaoInline(false)}
                onSave={handleSalvarInstituicaoInline as any}
                fields={instituicaoCreateFields as any}
                title="Criar Instituição"
            />
        </>
    );
};

export default QuickActions;