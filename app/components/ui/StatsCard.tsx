import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'blue',
  trend,
  className = ''
}) => {
  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600'
  };

  return (
    <Card className={className}>
      <CardContent className="flex items-center justify-between p-0 sm:p-0">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className={`text-xs flex items-center mt-1 ${
              trend?.isPositive ? 'text-green-600' : 'text-gray-600'
            }`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`w-7 h-7 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColorClasses[iconColor]}`}>
          <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        </div>
      </CardContent>
    </Card>
  );
};
