import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  ...props 
}) => {
  const baseStyles = "font-bold uppercase tracking-wider rounded-xl transition-all active:translate-y-[4px] active:shadow-none";
  
  const variants = {
    primary: "bg-brand text-white shadow-3d border-b-4 border-brand-dark hover:bg-brand-light",
    secondary: "bg-white text-gray-700 shadow-3d border-2 border-gray-200 border-b-4 hover:bg-gray-50",
    outline: "bg-transparent border-2 border-gray-300 text-gray-500 hover:bg-gray-100 shadow-none active:translate-y-0",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100 shadow-none border-0 active:translate-y-0",
  };

  const sizes = {
    sm: "px-3 py-1 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
