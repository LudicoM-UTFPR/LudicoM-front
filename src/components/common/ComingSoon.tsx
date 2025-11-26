import React from "react";
import type { ComingSoonProps } from "../../shared/types";

const ComingSoon: React.FC<ComingSoonProps> = React.memo(({ pageName }) => {
    return (
        <section className="coming-soon-section">
            <h1 className="coming-soon-title">
                {pageName} será implementado em breve
            </h1>
        </section>
    );
});

ComingSoon.displayName = 'ComingSoon';

export default ComingSoon;