import React, { useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import useScrollVisibility from "../../shared/hooks/useScrollVisibility";
import { ROUTES, UI_CONSTANTS, MESSAGES } from "../../shared/constants";

const Header: React.FC = () => {
    const location = useLocation();
    const headerRef = useScrollVisibility(UI_CONSTANTS.SCROLL_THRESHOLD);

    const handleLoginClick = useCallback((): void => {
        alert(MESSAGES.LOGIN_PLACEHOLDER);
    }, []);

    const isActive = useCallback((path: string): boolean => {
        if (path === ROUTES.HOME && location.pathname === ROUTES.HOME) return true;
        if (path !== ROUTES.HOME && location.pathname.startsWith(path)) return true;
        return false;
    }, [location.pathname]);

    return (
        <header ref={headerRef} className="header">
            <div className="header-container">
                <Link to={ROUTES.HOME} className="logo">
                    <img src="/logo.svg" alt="LudicoM Logo" />
                </Link>

                <nav className="nav">
                    <Link
                        to={ROUTES.HOME}
                        className={`nav-item ${isActive(ROUTES.HOME) ? "active" : ""}`}
                    >
                        Home
                    </Link>
                    <Link
                        to={ROUTES.EVENTOS}
                        className={`nav-item ${
                            isActive(ROUTES.EVENTOS) ? "active" : ""
                        }`}
                    >
                        Eventos
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
                        to={ROUTES.PARTICIPANTES}
                        className={`nav-item ${
                            isActive(ROUTES.PARTICIPANTES) ? "active" : ""
                        }`}
                    >
                        Participantes
                    </Link>
                    <Link
                        to={ROUTES.EMPRESTIMOS}
                        className={`nav-item ${
                            isActive(ROUTES.EMPRESTIMOS) ? "active" : ""
                        }`}
                    >
                        Empréstimos
                    </Link>
                </nav>

                <button className="login-btn" onClick={handleLoginClick}>
                    Login
                </button>
            </div>
        </header>
    );
};

export default Header;