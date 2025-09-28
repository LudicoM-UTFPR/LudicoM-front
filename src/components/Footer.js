import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <p>&copy; {currentYear} LudicoM - UTFPR. Todos os direitos reservados.</p>
          <p>Sistema de Gerenciamento de Atividades Lúdicas</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;