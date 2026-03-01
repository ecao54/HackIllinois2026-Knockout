// Arena
export const ARENA_RADIUS = 350;
export const SPAWN_RADIUS = ARENA_RADIUS * 0.6; // 210
export const ARENA_SHRINK = 0.85; // multiply radius by this each round (15% shrink)
export const SHRINK_DURATION = 1.0; // seconds for the shrink animation

// Penguin
export const PENGUIN_RADIUS = 25;
export const PENGUIN_MASS = 1.0;

// Physics
export const PHYSICS_HZ = 60;
export const DT = 1 / PHYSICS_HZ;
export const FRICTION_COEFF = 0.25;
export const GRAVITY = 980; // px/s^2, used only for normal force in friction calc
export const DRAG_COEFF = 0.001;
export const RESTITUTION = 0.9;
export const V_REST = 2; // px/s — below this, penguin is "at rest"
export const REST_FRAMES = 15; // consecutive rest frames to count as settled
export const MAX_SPEED = 900 * 1.5; // hard clamp to prevent energy explosions

// Launch
export const V_MAX = 900; // px/s
export const V_MIN = 40; // px/s
export const DEAD_ZONE = 3; // % below which launch is canceled
export const POWER_EXPONENT = 1.3; // curve for fine low-power control

// Drag-to-launch
export const MAX_DRAG_DISTANCE = 150; // px in world space = 100% power

// Round timing (simultaneous mode)
export const AIM_DURATION = 8; // seconds for everyone to aim and lock in
export const ROUND_END_DURATION = 1.5; // just long enough for the shrink animation + brief pause
export const MAX_SETTLE_TIME = 10; // seconds before force-settle
export const AUTO_FIRE_IDLE_POWER = 25; // % power if player never locked in

// UI
export const DRAG_LINE_COLOR = 'rgba(249, 115, 22, 0.6)';
export const DRAG_ARROW_COLOR = 'rgba(249, 115, 22, 0.8)';

// Scoring (FFA placement points)
export const FFA_POINTS = [10, 6, 4, 3, 2, 1, 1, 1] as const;

// Colors for penguin scarves
export const SCARF_COLORS = [
  '#f97316', '#38bdf8', '#34d399', '#f472b6',
  '#a78bfa', '#f87171', '#fbbf24', '#2dd4bf',
] as const;
