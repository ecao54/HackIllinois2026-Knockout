interface Props {
  className?: string;
  children?: React.ReactNode;
}

export default function ArcticBackground({ className = '', children }: Props) {
  return (
    <div
      className={`min-h-screen relative overflow-hidden ${className}`}
    >
      {/* Layered arctic gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, var(--color-arctic-sky) 0%, var(--color-arctic-ice) 50%, #CDEBFF 100%)',
        }}
      />
      {/* Subtle radial frost glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(240, 248, 255, 0.6) 0%, transparent 60%)',
        }}
      />
      {children}
    </div>
  );
}
