import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header, Footer } from "./components";
import { Home, Eventos, Jogos, Participantes, Emprestimos, Login } from "./pages";
import { ROUTES } from "./constants";
import "./styles/Main.css";

const App: React.FC = () => {
    return (
        <Router>
            <div className="app">
                <Header />
                <main className="main-content">
                    <Routes>
                        <Route path={ROUTES.HOME} element={<Home />} />
                        <Route path={ROUTES.EVENTOS} element={<Eventos />} />
                        <Route path={ROUTES.JOGOS} element={<Jogos />} />
                        <Route
                            path={ROUTES.PARTICIPANTES}
                            element={<Participantes />}
                        />
                        <Route path={ROUTES.EMPRESTIMOS} element={<Emprestimos />} />
                        <Route path={ROUTES.LOGIN} element={<Login />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
};

export default App;