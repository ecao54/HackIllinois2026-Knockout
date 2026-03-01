# API Team: Burner Wallet Balance (Implemented)

**Status:** Implemented. The API now returns `usdc_balance` (total), `on_chain_usdc`, and `simulated_usdc`. Game payouts credit `simulated_usdc`; the frontend uses `usdc_balance` for spendability.

---

*Original request (for context):*

**Context:** The API's burner wallet / player balance management needed credit-on-settle capability. Generic "credit account on settlement" — not Web3-specific.

**Issue (resolved):** Winner's balance now reflects payouts via `simulated_usdc`; `usdc_balance` = on-chain + simulated.

---

## Expected Behavior

1. Player deposits $0.50 via Stripe checkout → `usdc_balance` = 0.50
2. Player joins game, buy-in deducted → `usdc_balance` = 0 (or reduced)
3. Game ends, we call `POST /v1/games/:id/resolve` with `{ winner: player_id, ... }`
4. **The winner's `usdc_balance` should be credited** with their share of the prize pool (e.g. 100% for solo, 70% for 1st place)
5. `GET /v1/players/:id` must return the **updated** `usdc_balance`

---

## Current Problem

We call `resolve` when the game ends. The frontend then shows "Paid out to your test account" with account/confirmation IDs. But when the user clicks "Play Again" and returns to the setup screen, we fetch `GET /v1/players/:id` and the balance is still the pre-win amount (e.g. $0.50 instead of $1.10 after a win).

**The burner wallet / player record exists.** The API already supports creating players and debiting balance on join. We need the complementary operation: **credit balance on resolve**.

---

## What We Need

Generic balance credit on game settlement. When `POST /v1/games/:id/resolve` is called:

1. Credit the winner's `usdc_balance` (in Redis or wherever it's stored) with their payout amount
2. For our demo: winner gets 100% of `prize_pool_usdc` (single real player)
3. The credit can be simulated (simple Redis increment) — no on-chain required for hackathon

Example logic:

```
on resolve(winner, placements, distribution):
  payout = prize_pool_usdc * (distribution[0] / 100)   # e.g. 100% for solo
  player = getPlayer(winner)
  player.usdc_balance += payout
  savePlayer(player)
```

---

## Verification

After implementing:

1. Create player, fund via Stripe ($0.50)
2. Create game, join with force_start
3. Play (client-side), game ends with winner
4. Frontend calls `resolve` with winner
5. `GET /v1/players/:id` → `usdc_balance` should show the credited amount (e.g. ~$1.00 if they won the pool)

---

## Contract

We rely on:
- `GET /v1/players/:id` returning `usdc_balance` as a live, up-to-date value
- `resolve` triggering a balance credit for the winner before returning

Without this, players cannot "play again" using their winnings — the UI would always prompt for another deposit.

---

## Design note

The API should support managing burner wallet balances (create, fund, debit, credit) as generic account capabilities. Our Web3 game uses these to work end-to-end, but the design should not assume Web3 — any app that needs in-app funds or game payouts could use the same contracts.
