import React, { useState, useEffect, useCallback, useMemo } from "react";
import emprestimosData from "../../data/emprestimos.json";
import { MESSAGES } from "../../constants";
import { escapeHtml, filterByMultipleFields, handleError } from "../../utils";
import { SearchIcon } from "../icons";
import type { Emprestimo } from "../../types";

const EmprestimosTable: React.FC = () => {
    const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
    const [filtro, setFiltro] = useState<string>("");

    useEffect(() => {
        try {
            // Simula carregamento dos dados com validação de tipos
            const validatedData = emprestimosData.map((item): Emprestimo => ({
                id: Number(item.id),
                jogo: String(item.jogo || ""),
                participante: String(item.participante || ""),
                horario: String(item.horario || "")
            }));
            setEmprestimos(validatedData);
        } catch (error) {
            handleError(error, "EmprestimosTable - Data Loading");
        }
    }, []);

    // Memoiza os empréstimos filtrados para evitar recálculos desnecessários
    const emprestimosFiltrados = useMemo((): Emprestimo[] => {
        return filterByMultipleFields(emprestimos, filtro, ['jogo', 'participante']);
    }, [filtro, emprestimos]);

    const handleFiltroChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
        setFiltro(e.target.value);
    }, []);

    const handleBuscaClick = useCallback((): void => {
        // Função já é executada automaticamente pelo useMemo
        // Mantida para compatibilidade com o botão
    }, []);

    const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === "Enter") {
            handleBuscaClick();
        }
    }, [handleBuscaClick]);

    const handleDevolver = useCallback((id: number): void => {
        try {
            const item = emprestimos.find((emp) => emp.id === id);
            if (
                item &&
                window.confirm(
                    `${MESSAGES.CONFIRM_RETURN}\n\nJogo: ${item.jogo}\nParticipante: ${item.participante}\nHorário: ${item.horario}`
                )
            ) {
                setEmprestimos(prevEmprestimos => 
                    prevEmprestimos.filter((emp) => emp.id !== id)
                );
                console.log("Devolvido id:", id);
            }
        } catch (error) {
            handleError(error, "EmprestimosTable - HandleDevolver");
        }
    }, [emprestimos]);

    return (
        <section className="tabela-emprestimo">
            {/* Campo de Busca */}
            <div className="busca-container">
                <input
                    type="text"
                    className="busca-input"
                    placeholder={MESSAGES.SEARCH_PLACEHOLDER}
                    value={filtro}
                    onChange={handleFiltroChange}
                    onKeyPress={handleKeyPress}
                />
                <button className="busca-btn" onClick={handleBuscaClick}>
                    <SearchIcon />
                </button>
            </div>

            {/* Tabela */}
            <div className="tabela-wrapper">
                <table className="tabela">
                    <caption className="tabela-titulo">
                        Empréstimos Ativos
                    </caption>
                    <thead className="tabela-head">
                        <tr className="tabela-header-row">
                            <th className="tabela-header">Jogo</th>
                            <th className="tabela-header">Participante</th>
                            <th className="tabela-header">
                                Horário Empréstimo
                            </th>
                            <th className="tabela-header">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="tabela-body">
                        {emprestimosFiltrados.map((item) => (
                            <tr
                                key={item.id}
                                className="tabela-row"
                                data-id={item.id}
                            >
                                <td
                                    className="tabela-cell"
                                    title={escapeHtml(item.jogo)}
                                >
                                    {escapeHtml(item.jogo)}
                                </td>
                                <td
                                    className="tabela-cell"
                                    title={escapeHtml(item.participante)}
                                >
                                    {escapeHtml(item.participante)}
                                </td>
                                <td className="tabela-cell">
                                    {escapeHtml(item.horario)}
                                </td>
                                <td className="tabela-cell">
                                    <button
                                        className="devolver-btn"
                                        onClick={() => handleDevolver(item.id)}
                                    >
                                        Devolver
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default EmprestimosTable;