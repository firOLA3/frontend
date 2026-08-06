'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  animationDelay?: number;
}

export function Card({ 
  children, 
  className, 
  animationDelay = 0,
  ...props 
}: CardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  return (
    <div
      className={cn(
        'card transition-all duration-500',
        'opacity-0 translate-y-4',
        visible && 'opacity-100 translate-y-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}