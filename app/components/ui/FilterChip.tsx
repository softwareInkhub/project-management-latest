import React from 'react';
import { X } from 'lucide-react';

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: (value: string) => void;
  variant?: 'default' | 'active' | 'selected';
  size?: 'sm' | 'md';
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  value,
  onRemove,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-all duration-200 cursor-pointer';
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  const variantClasses = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200',
    active: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200',
    selected: 'bg-blue-500 text-white hover:bg-blue-600 border border-blue-500'
  };

  return (
    <div className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      <span className="mr-1">{label}</span>
      <button
        type="button"
        onClick={() => onRemove(value)}
        className="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
