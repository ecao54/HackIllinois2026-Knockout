# API Team Request — Must-Haves for Demo

**From:** Frontend / Game team
**Priority:** P0 for hackathon demo
**Deadline:** Before final demo run

---

## Design intent

The API should remain a **general-purpose platform** — not built exclusively for Web3 games. The requests below add generic capabilities that any client can use:

- **Burner wallet / player balance management:** The ability to create players, fund balances (e.g. via Stripe), deduct on game join, and credit on game resolve. This is standard account/balance semantics — useful for games, apps, or any flow that needs in-app funds. Our Web3 game uses it; the API design should not assume Web3.
- **Game lifecycle:** Start with fewer players, resolve externally, settle payouts — generic game-platform primitives that support our knockout game as one of many possible clients.

---

## Burner wallet capabilities (generic)

The API manages player/burner wallets with standard balance operations. These should be general-purpose — any client (games, apps, etc.) can use them:

| Capability | Endpoint | Status |
|------------|----------|--------|
| Create wallet | `POST /v1/players` | ✓ |
| Fund (Stripe) | `POST /v1/players/:id/checkout-session` | ✓ |
| Read balance | `GET /v1/players/:id` | ✓ |
| Debit (join game) | `POST /v1/games/:id/join` | ✓ |
| **Credit (on resolve)** | Wire into `POST /v1/games/:id/resolve` | **Missing** |

The missing piece: when a game resolves, credit the winner's balance. Generic settlement, not Web3-specific.

---

## 3 BLOCKERS — We cannot demo without these

### Blocker 1: Game requires 2+ players to start

**Problem:** The `join` endpoint sets `status: "active"` only when `players.length >= 2`. Games with client-side AI/bots, single-player modes, or practice sessions may have only one real player joining via API. Those games stay stuck in `waiting` forever.

**What we need:** A generic way to start with fewer than `max_players` — useful for single-player, demo, or practice modes. One of these:
- A `force_start` boolean on join: `POST /v1/games/:id/join` with `{ player_id, force_start: true }` — sets status to `active` even with 1 player
- Or a separate `POST /v1/games/:id/start` endpoint
- Or lower the minimum to 1 player when an env flag like `DEMO_MODE=true` is set

### Blocker 2: No way to resolve game externally

**Problem:** The API only resolves games through the grid-based `move` endpoint. Games with client-authoritative resolution (e.g., physics, card games, board games) don't use `/move`. They need a way to report the final outcome to the platform.

**What we need:** `POST /v1/games/:id/resolve`

```json
// Request
{
  "winner": "<player_id>",
  "placements": [
    { "player_id": "abc", "place": 1 },
    { "player_id": "bot-1", "place": 2 }
  ],
  "distribution": [100],
  "prize_pool_usdc": "4.00"
}

// Response
{
  "game_id": "...",
  "status": "resolved",
  "winner": "<player_id>",
  "prize_pool_usdc": "2.00",
  "settlement_status": "completed"
}
```

This should:
- Set `status` to `"resolved"` and `winner` to the provided `player_id`
- **Credit the winner's in-app balance** with their payout (Blocker 3)

**CRITICAL: Resolve must ONLY update in-app balance. It must NOT initiate a Stripe withdrawal.** Withdrawal happens only via `POST /v1/players/:id/cashout` when the user explicitly clicks "Cash Out" on the main page.

### Blocker 3: Burner wallet balance not updated on resolve

**Problem:** The player/burner wallet has a balance (`usdc_balance`) that is debited on join, but there is no REST path to credit it when a game resolves. The wallet exists; we need the API to support updating it.

**What we need:** Generic balance management on resolve — when `resolve` is called, credit the winner's balance with their payout. This is standard "credit account on settlement" behavior, not Web3-specific. For hackathon: a Redis/DB balance update is enough; on-chain can plug in later.

**Important:** `resolve` must ONLY credit the in-app balance. It must NOT trigger a Stripe withdrawal or transfer funds out. Withdrawal is a separate, explicit action via `POST /v1/players/:id/cashout`. The user withdraws only when they click "Cash Out" on the main page.

**Winner takes all:** Only 1st place gets a payout (100% of pool). 2nd place and below get nothing.

**prize_pool_usdc:** The frontend sends `prize_pool_usdc` in the resolve request (e.g. `"4.00"` for $0.50 × 8 players) because with `force_start` only one player joins — the API must use this value for payout, not buy_in × joined_count. Credit winner with 100% of prize_pool_usdc.

---

## Copy-paste for Slack / Discord

```
Hey API team — 3 generic platform capabilities we need (not Web3-specific):

1. **Start with fewer than max_players**: Add `force_start: true` on /join or a /start endpoint so single-player, bots, and practice modes work.

2. **POST /v1/games/:id/resolve**: For games that resolve client-side (physics, cards, etc.). Accepts `{ winner: player_id, placements: [...] }`, sets game to "resolved".

3. **Burner wallet balance on resolve**: When resolve runs, credit the winner's usdc_balance with their payout. The wallet/player record exists; we just need balance updates on settlement. Generic account credit — our Web3 game uses it, but the API shouldn't be designed only for Web3.

Request/response shapes in API_TEAM_REQUEST.md. LMK if questions!
```

---

## Also nice to have (from previous request)

### Placements + payouts in game response

After the game reaches `resolved` status, include these fields in `GET /v1/games/:id`:

```json
{
  "...existing fields...",
  "placements": [
    { "player_id": "p1", "place": 1 },
    { "player_id": "p2", "place": 2 }
  ],
  "payouts": [
    { "player_id": "p1", "amount_usdc": "1.40", "status": "settled", "settlement_mode": "simulated" },
    { "player_id": "p2", "amount_usdc": "0.60", "status": "settled", "settlement_mode": "simulated" }
  ],
  "distribution_rule": "70/30",
  "settlement_status": "completed"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `placements[].player_id` | string | Yes | Must match `player_id` from join |
| `placements[].place` | number | Yes | 1 = winner, 2 = runner-up |
| `payouts[].player_id` | string | Yes | Only top-2 need payouts |
| `payouts[].amount_usdc` | string | Yes | Decimal string, 2 places |
| `payouts[].status` | string | Yes | `"pending"` / `"settled"` / `"simulated"` |
| `payouts[].settlement_mode` | string | Yes | `"simulated"` for hackathon |
| `pool_usdc` | string | Yes | Total prize pool |
| `settlement_status` | string | Yes | `"processing"` / `"completed"` |

---

## Critical: Identity key

**`player_id` must be canonical across all responses.** The `winner` field uses `player_id` — good. Placements, payouts, and resolve should also use `player_id` (not `pubkey`).

---

## What the frontend already handles

- If placements/payouts are missing, we fall back to 70/30 split computed client-side.
- Settlement status is displayed as "simulated" in the UI.
- We handle the error envelope `{ status, statusCode, error: { code, message, remediation } }`.

---

## What we DON'T need for hackathon

- Real on-chain escrow transfers
- Real Solana settlement
- Verified PDA addresses
- More than top-2 payouts

Just make the endpoints work and the demo flows end-to-end. The API stays general: burner wallet management (create, fund, debit, credit) and game lifecycle (start, resolve, settle) are generic platform capabilities. Our Web3 game is one client that uses them — the design should not assume Web3.
