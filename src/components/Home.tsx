import React from "react";
import WelcomeSection from "./WelcomeSection";
import QuickActions from "./QuickActions";
import EmprestimosTable from "./EmprestimosTable";

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