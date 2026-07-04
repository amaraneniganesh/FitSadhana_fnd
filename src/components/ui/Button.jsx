import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-1 select-none disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-foreground text-background hover:opacity-90 shadow-lg active:scale-95",
    secondary: "bg-secondary text-foreground hover:bg-card border border-border active:scale-95",
    gradient: "bg-accent text-white hover:opacity-90 shadow-lg shadow-accent/20 active:scale-95",
    outline: "border border-border text-foreground hover:bg-secondary active:scale-95",
    danger: "bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 active:scale-95",
    ghost: "text-text-secondary hover:text-foreground hover:bg-secondary active:scale-95"
  };

  return (
    <button className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
