
import React from 'react';

interface BaseWidgetProps {
  children: React.ReactNode;
  className?: string;
  delayIndex?: number;
}

export const BaseWidget: React.FC<BaseWidgetProps> = ({ children, className = '', delayIndex = 0 }) => {
  // Staggered animation delay
  const style = { animationDelay: `${Math.min(delayIndex * 100, 500)}ms` };

  return (
    <div 
        className={`mb-6 w-full animate-fade-in-up ${className}`} 
        style={style}
    >
      {children}
    </div>
  );
};
