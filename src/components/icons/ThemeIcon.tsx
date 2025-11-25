import React from "react";

interface ThemeIconProps {
    isDark: boolean;
}

const ThemeIcon: React.FC<ThemeIconProps> = ({ isDark }) => {
    if (isDark) {
        // Ícone de sol para indicar que pode mudar para tema claro
        return (
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <circle cx="12" cy="12" r="5" fill="currentColor" />
                <path
                    d="M12 1V3M12 21V23M23 12H21M3 12H1M20.485 3.515L19.071 4.929M4.929 19.071L3.515 20.485M20.485 20.485L19.071 19.071M4.929 4.929L3.515 3.515"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
        );
    }

    // Ícone de lua para indicar que pode mudar para tema escuro
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                fill="currentColor"
            />
        </svg>
    );
};

export default ThemeIcon;
