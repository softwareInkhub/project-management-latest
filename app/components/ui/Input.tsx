import React, { useState } from 'react';
import { Search, X, Filter } from 'lucide-react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'search' | 'modern-search';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  showClearButton?: boolean;
  showFilterButton?: boolean;
  onClear?: () => void;
  onFilterClick?: () => void;
}

export const Input: React.FC<InputProps> = ({
  variant = 'default',
  icon,
  iconPosition = 'left',
  size = 'md',
  showClearButton = false,
  showFilterButton = false,
  onClear,
  onFilterClick,
  className = '',
  value,
  onChange,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState('');
  const currentValue = value !== undefined ? value : internalValue;
  
  const baseClasses = 'w-full border transition-all duration-200 bg-white focus:bg-white';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const variantClasses = {
    default: 'border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    search: 'border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pl-10',
    'modern-search': 'border-blue-300 rounded-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 pl-12 pr-12'
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e);
    } else {
      setInternalValue(e.target.value);
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
    } else {
      setInternalValue('');
    }
  };

  return (
    <div className="relative">
      {/* Left Icon */}
      {icon && iconPosition === 'left' && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {variant === 'search' || variant === 'modern-search' ? <Search className={iconSize} /> : icon}
        </div>
      )}
      
      {/* Input Field */}
      <input
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        value={currentValue}
        onChange={handleChange}
        {...props}
      />
      
      {/* Right Icons */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
        {/* Clear Button */}
        {showClearButton && currentValue && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className={iconSize} />
          </button>
        )}
        
        {/* Custom Right Icon */}
        {icon && iconPosition === 'right' && !showClearButton && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
