# API Team — Follow-up Issues

**From:** Frontend / Game team  
**Date:** After rehaul integration

---

## Issue 1: Cash Out — "Haven't linked an account"

**Observed:** When the user clicks "Cash Out", they see an error like "you haven't linked an account".

**Expectation:** The user funded their balance via Stripe Checkout (deposit). They expect to be able to cash out to the same payment method / account they used to deposit — without a separate "link account" or Connect onboarding step.

**Current API behavior (from doc):** Cashout "Requires the player to have a connected Stripe account (via onboarding)".

**Request:** For users who deposited via Stripe Checkout, support cashing out to the original payment method (refund to card) without requiring separate Stripe Connect onboarding. Alternatively:

- **Option A:** Refund to original payment method when possible (Stripe supports this)
- **Option B:** For demo/hackathon: auto-create or pre-link a payout destination when the user completes checkout, so cashout works without an extra "link account" step
- **Option C:** If Connect onboarding is required, provide a clear onboarding URL/flow and error codes (e.g. `PAYOUT_ACCOUNT_REQUIRED` with `onboarding_url` in remediation)

---

## Issue 2: Balance not updating after game resolve

**Observed:** After a game ends (win or loss), the player's `usdc_balance` from `GET /v1/players/:id` does not change. Resolve is called with `player_results` (win: `+pool`, loss: `-wager`).

**Our resolve payload (example):**
```json
{
  "winner": "human-player-uuid",
  "player_results": [
    { "player_id": "human-player-uuid", "net_usdc": "2.00" }
  ]
}
```

**For loss:**
```json
{
  "winner": "bot-winner",
  "player_results": [
    { "player_id": "human-player-uuid", "net_usdc": "-0.50" }
  ]
}
```

**Request:** Please verify that `POST /v1/games/:id/resolve` with `player_results` correctly updates `simulated_usdc` (and thus `usdc_balance`) for the player. If `winner` must be a joined player, we may be blocked when the human loses (our bots are client-side only; we use `"bot-winner"` as a placeholder). If so, we need either:

- Allow `winner` to be a placeholder/non-joined ID when using explicit `player_results`, or  
- Document a supported way to represent "bot won" for single-human + bots games.

---

## Copy-paste for Slack / Discord

```
Hey API team — 2 follow-up issues from integration:

1. **Cash Out:** Users get "haven't linked an account" when cashing out. They already deposited via Stripe Checkout. Can we support cash-out to original payment method (refund) or auto-link on checkout so they don't need a separate Connect onboarding step?

2. **Balance not updating on resolve:** We call resolve with player_results (net_usdc +/-). Balance from GET /v1/players/:id doesn't change. Please confirm resolve actually updates simulated_usdc. Also: when human loses we send winner: "bot-winner" (bots are client-side). Does the API accept that, or do we need a different approach?

Details in API_TEAM_ISSUES.md. Thanks!
```
