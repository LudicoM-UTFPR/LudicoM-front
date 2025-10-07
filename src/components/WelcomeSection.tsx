import React from "react";

const WelcomeSection: React.FC = React.memo(() => {
    return (
        <section className="welcome-section">
            <h1 className="welcome-title">Bem Vindo ao Ludico Manager</h1>
        </section>
    );
});

WelcomeSection.displayName = 'WelcomeSection';

export default WelcomeSection;