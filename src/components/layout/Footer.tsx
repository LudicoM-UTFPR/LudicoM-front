import React, { useMemo } from "react";

const Footer: React.FC = React.memo(() => {
    const currentYear = useMemo(() => new Date().getFullYear(), []);

    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-content">
                    <p>
                        &copy; {currentYear} LudicoM - UTFPR. Todos os direitos
                        reservados.
                    </p>
                    <p>Sistema de Gerenciamento de Atividades Lúdicas</p>
                </div>
            </div>
        </footer>
    );
});

Footer.displayName = 'Footer';

export default Footer;