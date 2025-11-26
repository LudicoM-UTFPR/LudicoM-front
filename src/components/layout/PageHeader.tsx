import React from "react";
import type { PageHeaderProps } from "../../shared/types";

const PageHeader: React.FC<PageHeaderProps> = React.memo(({
    title,
    buttonText,
    onButtonClick,
    showButton = true
}) => {
    return (
        <section className="page-header">
            <div className="page-header-content">
                <h1 className="page-title">{title}</h1>
                {showButton && buttonText && (
                    <button 
                        className="btn btn--xlarge btn--primary"
                        onClick={onButtonClick}
                        type="button"
                    >
                        {buttonText}
                    </button>
                )}
            </div>
        </section>
    );
});

PageHeader.displayName = 'PageHeader';

export default PageHeader;