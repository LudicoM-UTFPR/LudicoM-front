import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const container = document.getElementById("root");

if (!container) {
    throw new Error("Root element not found! Make sure you have a div with id='root' in your HTML.");
}

const root = createRoot(container);

root.render(
    // StrictMode desabilitado para evitar dupla montagem que causa requisições canceladas
    // Em desenvolvimento, ele força remontagem de componentes para detectar efeitos colaterais
    // <React.StrictMode>
        <App />
    // </React.StrictMode>
);