import React, { useCallback } from "react";
import { MESSAGES } from "../../constants";

const QuickActions: React.FC = () => {
    const handleCriarEvento = useCallback((): void => {
        alert(MESSAGES.CRIAR_EVENTO);
    }, []);

    const handleConsultarJogo = useCallback((): void => {
        alert(MESSAGES.CONSULTAR_JOGO);
    }, []);

    const handleRegistrarEmprestimo = useCallback((): void => {
        alert(MESSAGES.REGISTRAR_EMPRESTIMO);
    }, []);

    return (
        <section className="acoes-rapidas">
            <h2 className="acoes-title">Ações Rápidas</h2>
            <div className="acoes-buttons">
                <button className="acao-btn" onClick={handleCriarEvento}>
                    Criar Evento
                </button>
                <button className="acao-btn" onClick={handleConsultarJogo}>
                    Consultar Jogo
                </button>
                <button
                    className="acao-btn"
                    onClick={handleRegistrarEmprestimo}
                >
                    Registrar Empréstimo
                </button>
            </div>
        </section>
    );
};

export default QuickActions;