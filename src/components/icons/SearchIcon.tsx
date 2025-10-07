import React from "react";
import type { SearchIconProps } from "../../types";

const SearchIcon: React.FC<SearchIconProps> = React.memo(({ 
    width = 24, 
    height = 24, 
    stroke = "#666666", 
    strokeWidth = 2 
}) => (
    <svg
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Buscar"
    >
        <path
            d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
));

SearchIcon.displayName = 'SearchIcon';

export default SearchIcon;