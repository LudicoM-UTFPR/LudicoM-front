import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header, Footer } from "../components";
import { ToastProvider } from "../components/common";
import { ROUTES } from "../shared/constants";
import "../styles/Main.css";

// Lazy loaded pages for code splitting
const Home = React.lazy(() => import("../pages/Home"));
const Eventos = React.lazy(() => import("../pages/Eventos"));
const Instituicoes = React.lazy(() => import("../pages/Instituicoes"));
const Jogos = React.lazy(() => import("../pages/Jogos"));
const Participantes = React.lazy(() => import("../pages/Participantes"));
const Emprestimos = React.lazy(() => import("../pages/Emprestimos"));
const Login = React.lazy(() => import("../pages/Login"));

const App: React.FC = () => {
    return (
        <ToastProvider>
            <Router>
                <div className="app">
                    <Header />
                    <main className="main-content">
                                                <Suspense fallback={<div className="lazy-fallback">Carregando...</div>}>
                                                    <Routes>
                                                        <Route path={ROUTES.HOME} element={<Home />} />
                                                        <Route path={ROUTES.EVENTOS} element={<Eventos />} />
                                                        <Route path={ROUTES.INSTITUICOES} element={<Instituicoes />} />
                                                        <Route path={ROUTES.JOGOS} element={<Jogos />} />
                                                        <Route path={ROUTES.PARTICIPANTES} element={<Participantes />} />
                                                        <Route path={ROUTES.EMPRESTIMOS} element={<Emprestimos />} />
                                                        <Route path={ROUTES.LOGIN} element={<Login />} />
                                                    </Routes>
                                                </Suspense>
                    </main>
                    <Footer />
                </div>
            </Router>
        </ToastProvider>
    );
};

export default App;