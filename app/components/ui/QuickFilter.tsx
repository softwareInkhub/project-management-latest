import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar, Check, X } from 'lucide-react';

interface QuickFilterOption {
  value: string;
  label: string;
  count?: number;
}

interface QuickFilterProps {
  label: string;
  icon?: React.ReactNode;
  options: QuickFilterOption[];
  value: string | string[] | { from: string; to: string };
  onChange: (value: string | string[] | { from: string; to: string }) => void;
  multiple?: boolean;
  showCount?: boolean;
  placeholder?: string;
  type?: 'default' | 'date';
  className?: string;
}

const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'next7Days', label: 'Next 7 Days' },
  { value: 'custom', label: 'Custom Range...' }
];

export const QuickFilter: React.FC<QuickFilterProps> = ({
  label,
  icon,
  options,
  value,
  onChange,
  multiple = false,
  showCount = false,
  placeholder,
  type = 'default',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [mobileDropdownPosition, setMobileDropdownPosition] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 200 });
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const mobileDatePickerRef = useRef<HTMLDivElement>(null);
  const desktopDatePickerRef = useRef<HTMLDivElement>(null);

  // Debug: Log state changes
  useEffect(() => {
    if (isOpen) {
      console.log('QuickFilter opened:', label, 'Type:', type, 'Options:', options.length);
    }
  }, [isOpen, label, type, options.length]);

  // Calculate dropdown position for mobile (only when viewport < 1024px)
  useEffect(() => {
    if ((isOpen || showCustomDatePicker) && buttonRef.current && window.innerWidth < 1024) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMobileDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.max(200, rect.width)
      });
    }
  }, [isOpen, showCustomDatePicker]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside button and all dropdown variations
      const isClickOutside = 
        buttonRef.current && !buttonRef.current.contains(target) &&
        (!mobileDropdownRef.current || !mobileDropdownRef.current.contains(target)) &&
        (!desktopDropdownRef.current || !desktopDropdownRef.current.contains(target)) &&
        (!mobileDatePickerRef.current || !mobileDatePickerRef.current.contains(target)) &&
        (!desktopDatePickerRef.current || !desktopDatePickerRef.current.contains(target));
      
      if (isClickOutside) {
        setIsOpen(false);
        setShowCustomDatePicker(false);
      }
    };

    if (isOpen || showCustomDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showCustomDatePicker]);

  const handleOptionClick = (optionValue: string) => {
    // Handle custom date range
    if (type === 'date' && optionValue === 'custom') {
      setShowCustomDatePicker(true);
      setIsOpen(false);
      return;
    }

    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const handleApplyCustomDateRange = () => {
    if (customFromDate && customToDate) {
      onChange({ from: customFromDate, to: customToDate });
      setShowCustomDatePicker(false);
    }
  };

  const handleClearCustomDateRange = () => {
    setCustomFromDate('');
    setCustomToDate('');
    onChange('all');
    setShowCustomDatePicker(false);
  };

  const getDisplayText = () => {
    if (Array.isArray(value) && value.length > 0) {
      return `${label} ${value.length}`;
    } else if (typeof value === 'object' && value !== null && 'from' in value && 'to' in value) {
      // Custom date range
      const from = new Date(value.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const to = new Date(value.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${from} - ${to}`;
    } else if (!Array.isArray(value) && typeof value === 'string' && value && value !== 'all') {
      if (type === 'date') {
        const selectedPreset = DATE_PRESETS.find(opt => opt.value === value);
        return selectedPreset ? selectedPreset.label : label;
      }
      const selectedOption = options.find(opt => opt.value === value);
      return selectedOption ? selectedOption.label : label;
    }
    return label;
  };

  const isSelected = (optionValue: string) => {
    if (Array.isArray(value)) {
      return value.includes(optionValue);
    }
    if (typeof value === 'string') {
      return value === optionValue;
    }
    return false;
  };

  const hasActiveFilter = Array.isArray(value) 
    ? value.length > 0 
    : value && value !== 'all' && value !== '';

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('QuickFilter clicked:', label, 'isOpen:', isOpen);
          setIsOpen(!isOpen);
        }}
        className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg border transition-all ${
          hasActiveFilter || isOpen
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
        }`}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="text-sm font-medium whitespace-nowrap">{getDisplayText()}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Mobile Dropdown - Fixed positioning */}
          <div
            ref={mobileDropdownRef}
            className="lg:hidden fixed min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] py-2"
            style={{
              top: `${mobileDropdownPosition.top}px`,
              left: `${mobileDropdownPosition.left}px`,
              width: `${mobileDropdownPosition.width}px`
            }}
          >
            {type === 'date' ? (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Quick Presets
                </div>
                {DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleOptionClick(preset.value)}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      isSelected(preset.value)
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </>
            ) : (
              <>
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionClick(option.value)}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                      isSelected(option.value)
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      {multiple && (
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          isSelected(option.value)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected(option.value) && <Check className="w-3 h-3 text-white" />}
                        </div>
                      )}
                      <span>{option.label}</span>
                    </span>
                    {showCount && option.count !== undefined && (
                      <span className="text-xs text-gray-500">({option.count})</span>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Desktop Dropdown - Absolute positioning */}
          <div
            ref={desktopDropdownRef}
            className="hidden lg:block absolute top-full mt-2 left-0 min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] py-2"
          >
            {type === 'date' ? (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Quick Presets
                </div>
                {DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleOptionClick(preset.value)}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      isSelected(preset.value)
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </>
            ) : (
              <>
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionClick(option.value)}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                      isSelected(option.value)
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      {multiple && (
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          isSelected(option.value)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected(option.value) && <Check className="w-3 h-3 text-white" />}
                        </div>
                      )}
                      <span>{option.label}</span>
                    </span>
                    {showCount && option.count !== undefined && (
                      <span className="text-xs text-gray-500">({option.count})</span>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}

      {/* Custom Date Range Picker */}
      {showCustomDatePicker && (
        <>
          {/* Mobile Date Picker */}
          <div
            ref={mobileDatePickerRef}
            className="lg:hidden fixed min-w-[300px] bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] p-4"
            style={{
              top: `${mobileDropdownPosition.top}px`,
              left: `${mobileDropdownPosition.left}px`
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Custom Date Range</h3>
              <button
                onClick={() => setShowCustomDatePicker(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={handleClearCustomDateRange}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleApplyCustomDateRange}
                disabled={!customFromDate || !customToDate}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Desktop Date Picker */}
          <div
            ref={desktopDatePickerRef}
            className="hidden lg:block absolute top-full mt-2 left-0 min-w-[300px] bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Custom Date Range</h3>
              <button
                onClick={() => setShowCustomDatePicker(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={handleClearCustomDateRange}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleApplyCustomDateRange}
                disabled={!customFromDate || !customToDate}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

