# Splice API — Game Integration Guide

**Base URL:** `http://localhost:3000` (or your deployed host)
**Auth:** All requests require `X-API-Key` header.

---

## Quick Start Flow

```
1. Create Player         POST /v1/players
2. Fund Player           POST /v1/players/:id/checkout-session  (skip for free games)
3. Create Game           POST /v1/games
4. Join Game             POST /v1/games/:id/join  (with force_start: true for single-player)
5. [Optional] Start      POST /v1/games/:id/start
6. Play (move or client) POST /v1/games/:id/move  (grid games only)
7. Resolve               POST /v1/games/:id/resolve
8. Check Final State     GET  /v1/games/:id
```

---

## Endpoints

### 1. `POST /v1/players`

Creates a burner wallet. No body needed.

```json
// Response 201
{ "player_id": "uuid", "public_key": "base58..." }
```

### `GET /v1/players/:id` — Player balance

```json
// Response 200
{
  "player_id": "uuid",
  "public_key": "base58...",
  "sol_balance": 0,
  "usdc_balance": 1.50,
  "on_chain_usdc": 1.00,
  "simulated_usdc": 0.50
}
```

| Field | Description |
|-------|-------------|
| `usdc_balance` | Total spendable (on-chain + simulated) |
| `on_chain_usdc` | Actual USDC in the Solana burner wallet |
| `simulated_usdc` | Platform-credited balance from game payouts |

### 2. `POST /v1/players/:id/checkout-session`

Funds the player with USDC via Stripe Checkout. Required if `buy_in_usdc > 0`.

```json
// Request (optional body)
{ "amount_usd": 0.5 }

// Response 200
{ "url": "https://checkout.stripe.com/...", "amount_usd": 0.5 }
```

### 3. `POST /v1/games`

Creates a game lobby. Use `"0.00"` for free/demo games.

```json
// Request
{ "buy_in_usdc": "0.00", "max_players": 4 }

// Response 201
{
  "game_id": "uuid",
  "pda_address": "pda_...",
  "escrow_address": "escrow_...",
  "buy_in_usdc": "0.00",
  "max_players": 4,
  "status": "waiting"
}
```

### 4. `POST /v1/games/:id/join`

Joins a player to a game. Requires `Idempotency-Key` header (any UUID).

Pass `force_start: true` to immediately activate the game with 1 player (for single-player, bots, practice, demo).

```json
// Header: Idempotency-Key: <uuid>

// Request
{
  "player_id": "uuid",
  "force_start": true
}

// Response 200
{
  "game_id": "uuid",
  "player_id": "uuid",
  "start_x": 0,
  "start_y": 0,
  "status": "active"
}
```

Without `force_start`, the game stays `"waiting"` until 2+ players join.

### 5. `POST /v1/games/:id/start`

Manually transitions a `waiting` game to `active`. Alternative to `force_start` on join. Requires at least 1 player. Requires `Idempotency-Key` header.

```json
// No body needed

// Response 200
{ "game_id": "uuid", "status": "active", "players": 1 }
```

### 6. `POST /v1/games/:id/move` (grid games only)

Moves a player on the 10x10 grid. Only relevant for grid-based games — skip this if your game uses client-authoritative resolution.

### 7. `POST /v1/games/:id/resolve`

**For client-authoritative games.** Reports the final outcome to the platform and triggers simulated payout settlement.

```json
// Header: Idempotency-Key: <uuid>

// Request
{
  "winner": "<player_id>",
  "placements": [{ "player_id": "p1", "place": 1 }],
  "distribution": [70, 30]
}

// Response 200
{
  "game_id": "uuid",
  "status": "resolved",
  "winner": "<player_id>",
  "prize_pool_usdc": "1.00",
  "placements": [...],
  "payouts": [...],
  "distribution_rule": "70/30",
  "settlement_status": "completed"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `winner` | Yes | Must be a `player_id` that joined the game |
| `placements` | No | If omitted, winner gets 1st, everyone else 2nd+ |
| `distribution` | No | Default: `[70, 30]` for 2+ players, `[100]` for solo |

### 8. `GET /v1/games/:id`

Returns full game state. After resolution, includes `placements`, `payouts`, `distribution_rule`, `settlement_status`.

---

## Game Lifecycle

```
waiting ──join(force_start)──▶ active ──resolve──▶ resolved
waiting ──join──▶ waiting ──/start──▶ active ──resolve──▶ resolved
waiting ──join x2──▶ active ──move/move...──▶ resolved (auto via grid)
```

---

## Identity Key

**`player_id` is canonical everywhere.** Winner, placements, payouts use `player_id` (not `pubkey`).

---

*Full guide synced from Splice API; see `tmp/hackillinois2026-api/docs/` for source.*
