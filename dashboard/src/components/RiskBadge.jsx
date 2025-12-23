export default function RiskBadge({ level, size = 'sm' }) {
  // Map critical to high for display, but keep red color
  const displayLevel = level === 'critical' ? 'high' : level;
  const colorLevel = level; // Keep original for color lookup

  const colors = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };

  const dotColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-amber-500',
    low: 'bg-emerald-500'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const colorClass = colors[colorLevel] || colors.low;
  const dotClass = dotColors[colorLevel] || dotColors.low;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${colorClass} ${sizes[size]}`}>
      <span className={`w-2 h-2 rounded-full ${dotClass}`} />
      <span className="capitalize">{displayLevel || 'low'}</span>
    </span>
  );
}
