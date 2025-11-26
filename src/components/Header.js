import React, { useContext } from 'react';
import { ThemeContext, NavigationContext } from '../App';
import '../styles/Header.css';

const Header = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { currentPage, setCurrentPage } = useContext(NavigationContext);

  const menuItems = ['Home', 'Eventos', 'Jogos', 'Participantes', 'Empréstimos'];

  const handleNavClick = (page) => {
    setCurrentPage(page);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1>LudicoM</h1>
        </div>
        
        <nav className="navigation">
          <ul className="nav-menu">
            {menuItems.map((item) => (
              <li key={item} className="nav-item">
                <button
                  className={`nav-button ${currentPage === item ? 'active' : ''}`}
                  onClick={() => handleNavClick(item)}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="theme-toggle">
          <button 
            className="theme-button" 
            onClick={toggleTheme}
            title={`Trocar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;