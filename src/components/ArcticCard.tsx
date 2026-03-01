interface Props {
  children: React.ReactNode;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
}

export default function ArcticCard({ children, className = '', title, style }: Props) {
  return (
    <div
      className={`bg-card-bg rounded-2xl p-5 border border-taupe/30 shadow-lg transition-all duration-200 hover:shadow-xl ${className}`}
      style={{ boxShadow: '0 10px 40px rgba(139, 115, 85, 0.08)', ...style }}
    >
      {title && (
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
