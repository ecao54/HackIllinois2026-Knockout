interface Props {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export default function StatBadge({ label, value, className = '' }: Props) {
  return (
    <div className={`bg-card-bg/80 backdrop-blur rounded-xl px-3 py-2 border border-taupe/20 min-w-[4rem] ${className}`}>
      <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">{label}</p>
      <p className="text-lg font-bold text-text-primary leading-tight">{value}</p>
    </div>
  );
}
