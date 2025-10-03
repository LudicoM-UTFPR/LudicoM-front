import React from "react";
import { WelcomeSection, QuickActions, EmprestimosTable } from "../components";

const Home: React.FC = () => {
    return (
        <>
            <WelcomeSection />
            <QuickActions />
            <EmprestimosTable />
        </>
    );
};

export default Home;