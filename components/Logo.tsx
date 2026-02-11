
import React from 'react';

const Logo: React.FC<{ className?: string, size?: number }> = ({ className = "", size = 40 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Stylized R in Red */}
    <path 
      d="M25 20V80M25 20H45C55 20 60 25 60 35C60 45 55 50 45 50H25M40 50L65 80" 
      stroke="#FF0000" 
      strokeWidth="10" 
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
    {/* Stylized E in Blue */}
    <path 
      d="M55 40H85M65 58H90M75 76H95" 
      stroke="#0000FF" 
      strokeWidth="8" 
      strokeLinecap="square"
    />
  </svg>
);

export default Logo;
