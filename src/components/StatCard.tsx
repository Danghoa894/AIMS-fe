import { LucideIcon } from 'lucide-react';
import { Card } from './ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  description?: string;
  iconBgColor?: string;
  iconColor?: string;
}

/**
 * StatCard: Reusable card component for dashboard statistics
 * Features: Icon, title, value, trend indicator, description
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  iconBgColor = 'bg-teal-100',
  iconColor = 'text-teal-600',
}: StatCardProps) {
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-gray-900 mb-2">{value}</p>
          
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={`text-xs ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              {description && (
                <span className="text-xs text-gray-500">{description}</span>
              )}
            </div>
          )}
          
          {!trend && description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
        
        <div className={`${iconBgColor} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
}
