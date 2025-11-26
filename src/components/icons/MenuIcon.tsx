import React from 'react';

interface MenuIconProps {
  open?: boolean;
}

const MenuIcon: React.FC<MenuIconProps> = ({ open = false }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="11"
        width="18"
        height="2"
        rx="1"
        fill="currentColor"
        style={{
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
          transformOrigin: '12px 12px',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)'
        }}
      />
      <rect
        x="3"
        y="11"
        width="18"
        height="2"
        rx="1"
        fill="currentColor"
        style={{
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
          transformOrigin: '12px 12px',
          transform: open ? 'rotate(-45deg)' : 'rotate(0deg)',
          opacity: open ? 1 : 0
        }}
      />
      <rect
        x="3"
        y="6"
        width="18"
        height="2"
        rx="1"
        fill="currentColor"
        style={{
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
          transformOrigin: '12px 7px',
          transform: open ? 'translateY(5px)' : 'translateY(0)',
          opacity: open ? 0 : 1
        }}
      />
      <rect
        x="3"
        y="16"
        width="18"
        height="2"
        rx="1"
        fill="currentColor"
        style={{
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
          transformOrigin: '12px 17px',
          transform: open ? 'translateY(-5px)' : 'translateY(0)',
          opacity: open ? 0 : 1
        }}
      />
    </svg>
  );
};

export default MenuIcon;
