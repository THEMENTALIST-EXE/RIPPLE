import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'amber' | 'red' | 'blue' | 'default';
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon,
  trend,
  color = 'default',
  subtitle
}) => {
  const colorStyles = {
    green: 'text-green-500 border-green-500/20 bg-green-500/5',
    amber: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
    red: 'text-red-500 border-red-500/20 bg-red-500/5',
    blue: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
    default: 'text-slate-200 border-slate-700 bg-slate-800',
  };

  const trendIcon = {
    up: <ArrowUpRight size={16} className="text-green-500" />,
    down: <ArrowDownRight size={16} className="text-red-500" />,
    neutral: <Minus size={16} className="text-slate-500" />,
  };

  return (
    <div className={`p-4 rounded-lg border bg-slate-800 shadow-sm flex flex-col gap-2 ${colorStyles[color]?.split(' ')[2]} ${colorStyles[color]?.split(' ')[1]}`}>
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-sm font-medium">{label}</span>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${color !== 'default' ? colorStyles[color]?.split(' ')[0] : 'text-white'}`}>
          {value}
        </span>
        {trend && (
          <span className="flex items-center">
            {trendIcon[trend]}
          </span>
        )}
      </div>

      {subtitle && (
        <span className="text-xs text-slate-500">{subtitle}</span>
      )}
    </div>
  );
};
