# Penguin Knockout

A 2D browser-based physics game where penguins launch, collide, and try to knock each other off a shrinking ice platform. Last penguin standing wins.

## How to Play

1. Pick the number of penguins (you + bots)
2. Each round, **click and drag** away from your penguin to aim (slingshot style) — drag distance = power
3. Release to lock in your shot — all penguins launch simultaneously
4. Knock opponents off the edge of the ice platform
5. The arena **shrinks 20%** after every round

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **HTML5 Canvas** for all game rendering
- **Tailwind CSS v4** for UI
- Custom **2D physics engine** — impulse-based collisions, friction, drag, fixed 60Hz timestep
- Deterministic **seeded PRNG** for reproducible simulations
- **Vitest** for unit tests (19 tests)

No external physics or game engine libraries.

## Getting Started

```bash
npm install
npm run setup   # creates .env from .env.example if missing
npm run dev
```

Open `http://localhost:5173/` in your browser.

### Enter Game Flow

"Enter Game" uses Stripe checkout and the Splice API. See [ENTER_GAME_SETUP.md](ENTER_GAME_SETUP.md) for what you need to do and what the API team must provide.

## Running Tests

```bash
npm test
```

## Color Palette

| Name        | Hex       |
|-------------|-----------|
| Soft Sky    | `#CDEBFF` |
| Pastel Blue | `#89C2FF` |
| Warm Yellow | `#FFD166` |
| Coral Pink  | `#FF8FA3` |
| Soft Navy   | `#2B2D42` |

## Project Structure

```
src/
├── game/           # Core game engine
│   ├── engine.ts   # Game state, phases, round management
│   ├── physics.ts  # 2D physics (collisions, friction, elimination)
│   ├── bot.ts      # Bot AI
│   ├── rng.ts      # Seeded PRNG
│   ├── constants.ts
│   ├── types.ts
│   └── ArenaCanvas.tsx  # Canvas renderer
├── pages/          # React pages (setup, game, game over)
├── components/     # Shared UI components
└── index.css       # Tailwind theme + animations
```
