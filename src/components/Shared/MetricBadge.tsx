import { clsx } from 'clsx';

interface MetricBadgeProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md';
}

export function MetricBadge({
  label,
  value,
  variant = 'default',
  size = 'md'
}: MetricBadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <div className={clsx(
      'rounded-lg',
      variantClasses[variant],
      sizeClasses[size]
    )}>
      <span className="font-medium">{label}: </span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
