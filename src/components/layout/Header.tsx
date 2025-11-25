import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useScrollVisibility from "../../shared/hooks/useScrollVisibility";
import { ROUTES, UI_CONSTANTS, MESSAGES } from "../../shared/constants";
import { ThemeIcon } from "../icons";

const Header: React.FC = () => {
    const location = useLocation();
    const headerRef = useScrollVisibility(UI_CONSTANTS.SCROLL_THRESHOLD);
    const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);
    const [logoSrc, setLogoSrc] = useState<string>('/logo.svg');

    // Carrega o tema salvo no localStorage ao iniciar
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const isDark = savedTheme !== 'light';
        setIsDarkTheme(isDark);
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        setLogoSrc(isDark ? '/logo.svg' : '/logo-claro.svg');
    }, []);

    const handleLoginClick = useCallback((): void => {
        alert(MESSAGES.LOGIN_PLACEHOLDER);
    }, []);

    const handleThemeToggle = useCallback((): void => {
        const newTheme = !isDarkTheme;
        setIsDarkTheme(newTheme);
        const theme = newTheme ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        setLogoSrc(newTheme ? '/logo.svg' : '/logo-claro.svg');
    }, [isDarkTheme]);

    const isActive = useCallback((path: string): boolean => {
        if (path === ROUTES.HOME && location.pathname === ROUTES.HOME) return true;
        if (path !== ROUTES.HOME && location.pathname.startsWith(path)) return true;
        return false;
    }, [location.pathname]);

    return (
        <header ref={headerRef} className="header">
            <div className="header-container">
                <Link to={ROUTES.HOME} className="logo">
                    <img src={logoSrc} alt="LudicoM Logo" />
                </Link>

                <nav className="nav">
                    <Link
                        to={ROUTES.HOME}
                        className={`nav-item ${isActive(ROUTES.HOME) ? "active" : ""}`}
                    >
                        Home
                    </Link>
                    <Link
                        to={ROUTES.EMPRESTIMOS}
                        className={`nav-item ${
                            isActive(ROUTES.EMPRESTIMOS) ? "active" : ""
                        }`}
                    >
                        Empréstimos
                    </Link>
                    <Link
                        to={ROUTES.JOGOS}
                        className={`nav-item ${
                            isActive(ROUTES.JOGOS) ? "active" : ""
                        }`}
                    >
                        Jogos
                    </Link>
                    <Link
                        to={ROUTES.INSTITUICOES}
                        className={`nav-item ${
                            isActive(ROUTES.INSTITUICOES) ? "active" : ""
                        }`}
                    >
                        Instituição
                    </Link>
                    <Link
                        to={ROUTES.EVENTOS}
                        className={`nav-item ${
                            isActive(ROUTES.EVENTOS) ? "active" : ""
                        }`}
                    >
                        Evento
                    </Link>
                    <Link
                        to={ROUTES.PARTICIPANTES}
                        className={`nav-item ${
                            isActive(ROUTES.PARTICIPANTES) ? "active" : ""
                        }`}
                    >
                        Participantes
                    </Link>
                </nav>

                <div className="header-actions">
                    <button 
                        className="theme-toggle-btn" 
                        onClick={handleThemeToggle}
                        aria-label={isDarkTheme ? "Mudar para tema claro" : "Mudar para tema escuro"}
                    >
                        <ThemeIcon isDark={isDarkTheme} />
                    </button>
                    <button className="login-btn" onClick={handleLoginClick}>
                        Login
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;