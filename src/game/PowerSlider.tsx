import { useRef, useCallback, useEffect, useState } from 'react';
import { SLIDER_HEIGHT } from './constants';

interface Props {
  visible: boolean;
  onPowerChange: (pct: number) => void;
  onRelease: (pct: number) => void;
}

function sliderColor(pct: number): string {
  if (pct < 30) return '#34d399';
  if (pct < 70) return '#fbbf24';
  return '#f87171';
}

export default function PowerSlider({ visible, onPowerChange, onRelease }: Props) {
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(0);

  const pctFromY = useCallback((clientY: number) => {
    const el = containerRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const relY = clientY - rect.top;
    const ratio = 1 - relY / rect.height;
    return Math.max(0, Math.min(100, ratio * 100));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const p = pctFromY(e.clientY);
    setPct(p);
    onPowerChange(p);
  }, [pctFromY, onPowerChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const p = pctFromY(e.clientY);
    setPct(p);
    onPowerChange(p);
  }, [pctFromY, onPowerChange]);

  const handlePointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    onRelease(pct);
  }, [onRelease, pct]);

  useEffect(() => {
    if (!visible) {
      setPct(0);
      dragging.current = false;
    }
  }, [visible]);

  if (!visible) return null;

  const fillColor = sliderColor(pct);

  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center select-none">
      <span className="text-xs font-bold text-slate-heading mb-1">{Math.round(pct)}%</span>
      <div
        ref={containerRef}
        className="relative w-11 rounded-full bg-white/80 border-2 border-ice-300 shadow-lg cursor-pointer backdrop-blur-sm overflow-hidden"
        style={{ height: SLIDER_HEIGHT }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Fill bar */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full transition-colors duration-100"
          style={{
            height: `${pct}%`,
            backgroundColor: fillColor,
            opacity: 0.85,
          }}
        />
        {/* Thumb */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-9 h-3 rounded-full bg-white border-2 shadow-md"
          style={{
            bottom: `calc(${pct}% - 6px)`,
            borderColor: fillColor,
          }}
        />
      </div>
      <span className="text-[10px] text-slate-muted mt-1">POWER</span>
    </div>
  );
}
