import React, { useState } from 'react';
import { cn } from '@/utils/cn';

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, fallback, size = 'md', className }) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
  };

  const showImage = src && !hasError;

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full select-none items-center justify-center font-medium',
        sizeClasses[size],
        !showImage && 'bg-blue-600 text-white',
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="aspect-square h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{fallback.toUpperCase()}</span>
      )}
    </div>
  );
};
