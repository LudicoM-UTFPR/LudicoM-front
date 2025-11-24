import React, { useState, useRef, useEffect } from 'react';

interface AutocompleteOption {
  value: string | number | boolean;
  label: string;
  searchValue?: string; // Valor adicional para busca (ex: código de barras)
}

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  className?: string;
}

export function Autocomplete({ value, onChange, options, placeholder, className }: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>(options);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Filtra opções baseado no valor digitado (busca em label e searchValue)
    const filtered = options.filter(option => {
      const searchTerm = value.toLowerCase();
      const matchLabel = option.label.toLowerCase().includes(searchTerm);
      const matchSearch = option.searchValue ? option.searchValue.toLowerCase().includes(searchTerm) : false;
      return matchLabel || matchSearch;
    });
    setFilteredOptions(filtered);
  }, [value, options]);

  useEffect(() => {
    // Fecha o dropdown ao clicar fora
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  const handleOptionClick = (option: AutocompleteOption) => {
    onChange(option.label);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      <input
        type="text"
        className={className}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        autoComplete="off"
      />
      {isOpen && filteredOptions.length > 0 && (
        <ul className="autocomplete-dropdown">
          {filteredOptions.map((option, index) => (
            <li
              key={index}
              className="autocomplete-option"
              onClick={() => handleOptionClick(option)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
