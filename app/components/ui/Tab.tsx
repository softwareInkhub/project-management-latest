import React from 'react';
import { X } from 'lucide-react';

interface TabProps {
  id: string;
  title: string;
  isActive: boolean;
  isClosable?: boolean;
  onClick: () => void;
  onClose?: () => void;
  className?: string;
}

export const Tab: React.FC<TabProps> = ({
  id,
  title,
  isActive,
  isClosable = true,
  onClick,
  onClose,
  className = ''
}) => {
  return (
    <div
      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium cursor-pointer transition-all duration-200 border-b-2 ${
        isActive
          ? 'bg-white text-blue-600 border-blue-600'
          : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-800'
      } ${className}`}
      onClick={onClick}
    >
      <span className="truncate max-w-32">{title}</span>
      {isClosable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="ml-1 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
