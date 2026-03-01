interface Props {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function PillButton({ children, selected = false, onClick, className = '' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 px-5 rounded-xl font-bold text-lg transition-all duration-200 cursor-pointer
        ${selected
          ? 'bg-penguin-orange text-text-primary scale-105 ring-2 ring-soft-brown/40'
          : 'bg-surface-elevated text-text-secondary hover:bg-taupe/20 hover:scale-[1.02]'
        }
        active:scale-[0.98]
        ${className}`}
    >
      {children}
    </button>
  );
}
