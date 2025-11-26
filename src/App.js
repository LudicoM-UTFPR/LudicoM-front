import React, { useState, useContext, createContext } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import PageContent from './components/PageContent';
import './styles/App.css';

// Context para gerenciar o tema
const ThemeContext = createContext();

// Context para gerenciar a navegação
const NavigationContext = createContext();

function App() {
  const [theme, setTheme] = useState('light');
  const [currentPage, setCurrentPage] = useState('Home');

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <NavigationContext.Provider value={{ currentPage, setCurrentPage }}>
        <div className={`app ${theme}`}>
          <Header />
          <main className="main-content">
            <PageContent />
          </main>
          <Footer />
        </div>
      </NavigationContext.Provider>
    </ThemeContext.Provider>
  );
}

export default App;
export { ThemeContext, NavigationContext };