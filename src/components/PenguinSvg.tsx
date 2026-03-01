interface Props {
  color?: string;
  size?: number;
  className?: string;
  dead?: boolean;
}

const COLORS: Record<string, { body: string; belly: string }> = {
  orange: { body: '#1a1a2e', belly: '#f97316' },
  blue: { body: '#1e3a5f', belly: '#38bdf8' },
  green: { body: '#064e3b', belly: '#34d399' },
  pink: { body: '#831843', belly: '#f472b6' },
  purple: { body: '#3b0764', belly: '#a78bfa' },
  red: { body: '#7f1d1d', belly: '#f87171' },
  yellow: { body: '#713f12', belly: '#fbbf24' },
  teal: { body: '#134e4a', belly: '#2dd4bf' },
  white: { body: '#1e293b', belly: '#e2e8f0' },
  lime: { body: '#365314', belly: '#a3e635' },
};

export default function PenguinSvg({ color = 'orange', size = 64, className = '', dead = false }: Props) {
  const c = COLORS[color] || COLORS.orange;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`${className} ${dead ? 'opacity-40' : ''}`}
      style={dead ? { filter: 'grayscale(1)' } : undefined}
    >
      {/* Body */}
      <ellipse cx="32" cy="38" rx="18" ry="22" fill={c.body} />
      {/* Belly */}
      <ellipse cx="32" cy="40" rx="12" ry="16" fill={c.belly} />
      {/* Left eye */}
      <circle cx="26" cy="28" r="4" fill="white" />
      <circle cx="27" cy="28" r="2" fill="#111" />
      {/* Right eye */}
      <circle cx="38" cy="28" r="4" fill="white" />
      <circle cx="39" cy="28" r="2" fill="#111" />
      {/* Beak */}
      <polygon points="32,32 28,36 36,36" fill="#f97316" />
      {/* Left flipper */}
      <ellipse cx="14" cy="40" rx="5" ry="10" fill={c.body} transform="rotate(-15 14 40)" />
      {/* Right flipper */}
      <ellipse cx="50" cy="40" rx="5" ry="10" fill={c.body} transform="rotate(15 50 40)" />
      {/* Feet */}
      <ellipse cx="25" cy="58" rx="6" ry="3" fill="#f97316" />
      <ellipse cx="39" cy="58" rx="6" ry="3" fill="#f97316" />
      {dead && (
        <>
          {/* X eyes for dead penguin */}
          <line x1="23" y1="25" x2="29" y2="31" stroke="#ef4444" strokeWidth="2" />
          <line x1="29" y1="25" x2="23" y2="31" stroke="#ef4444" strokeWidth="2" />
          <line x1="35" y1="25" x2="41" y2="31" stroke="#ef4444" strokeWidth="2" />
          <line x1="41" y1="25" x2="35" y2="31" stroke="#ef4444" strokeWidth="2" />
        </>
      )}
    </svg>
  );
}

export const PENGUIN_COLORS = Object.keys(COLORS);
