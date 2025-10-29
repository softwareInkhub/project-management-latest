'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size' | 'onChange'> {
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filter';
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string) => void;
}

export const Select: React.FC<SelectProps> = ({
  options,
  placeholder,
  size = 'md',
  variant = 'default',
  className = '',
  value,
  onChange,
  onValueChange,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string | undefined>(
    (value as string | undefined)
  );
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const selectRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [portalStyles, setPortalStyles] = useState<React.CSSProperties>({});

  const baseClasses = 'border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const variantClasses = {
    default: 'border-gray-200',
    filter: 'border-gray-200 text-sm min-w-[120px]'
  };

  // Calculate dropdown position based on available space
  const calculateDropdownPosition = () => {
    if (!selectRef.current) return;

    const selectRect = selectRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 200; // Approximate dropdown height
    const spaceBelow = viewportHeight - selectRect.bottom;
    const spaceAbove = selectRect.top;

    // Check if there's enough space below for the dropdown
    const hasEnoughSpaceBelow = spaceBelow >= dropdownHeight;
    // Check if there's more space above than below
    const hasMoreSpaceAbove = spaceAbove > spaceBelow;
    
    // Open upward if:
    // 1. There's not enough space below AND there's space above, OR
    // 2. There's significantly more space above (at least 50px more)
    if ((!hasEnoughSpaceBelow && spaceAbove > 100) || (hasMoreSpaceAbove && spaceAbove - spaceBelow > 50)) {
      setDropdownPosition('top');
    } else {
      setDropdownPosition('bottom');
    }

    // Compute fixed position for portal dropdown (all viewports)
    const top = dropdownPosition === 'top' ? selectRect.top - Math.min(dropdownHeight, spaceAbove - 8) - 8 : selectRect.bottom + 8;
    setPortalStyles({
      position: 'fixed',
      top: Math.max(8, top),
      left: selectRect.left,
      width: selectRect.width,
      zIndex: 9999
    });
  };

  useEffect(() => {
    if (isOpen) {
      calculateDropdownPosition();
    }
  }, [isOpen, dropdownPosition]);

  // Recalculate position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        calculateDropdownPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Recalculate on scroll when open (for fixed portal positioning)
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) {
        calculateDropdownPosition();
      }
    };
    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // If click is inside the portal dropdown, do nothing to allow option click
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      // If click is outside the root select button, close
      if (selectRef.current && !selectRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Use internal value to reflect selection immediately
  const selectedOption = options.find(option => option.value === (internalValue ?? (value as string | undefined)));

  const handleOptionClick = (optionValue: string) => {
    setInternalValue(optionValue);
    if (onChange) {
      const syntheticEvent = {
        target: { value: optionValue }
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
    if (onValueChange) {
      onValueChange(optionValue);
    }
    setIsOpen(false);
  };

  const dropdownContent = (
    <div 
      ref={dropdownRef}
      className={`w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto`}
      style={portalStyles}
      data-select-portal
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleOptionClick(option.value)}
          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
            option.value === value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`relative ${className}`} ref={selectRef} data-select-root>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} flex items-center justify-between text-left`}
        {...props}
      >
        <span className="text-sm">
          {selectedOption?.label || placeholder || 'Select...'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && createPortal(dropdownContent, document.body)}
    </div>
  );
};
