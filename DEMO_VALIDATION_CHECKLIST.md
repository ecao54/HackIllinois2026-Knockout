# End-to-End Demo Validation Checklist

## Build & Tests
- [x] `tsc --noEmit` — zero type errors
- [x] `vitest run` — 19/19 tests pass (physics + determinism)
- [x] `vite build` — clean production build (316 kB JS, 33 kB CSS)

## Mock Game Flow (offline, no API)
- [ ] PlaySetup: select player count, click Start Game
- [ ] MockGame: countdown 3-2-1, then AIMING phase begins
- [ ] Slingshot drag works — drag away from penguin, release to lock in
- [ ] All penguins launch simultaneously after timer or all lock in
- [ ] Physics: penguins slide, collide, and bounce off each other
- [ ] Elimination: penguin fully off arena → knocked out
- [ ] Arena shrinks after each round (15% per round, gradual 1s animation)
- [ ] Penguins pushed inward if overlapping new edge
- [ ] HUD shows: Round, Alive count, Pool (locked), Timer
- [ ] Game over navigates to MockGameOver with placement + payout
- [ ] MockGameOver: shows 1st/2nd place, 70/30 pool split, settlement animation
- [ ] Settlement steps animate: Verifying → Processing → Completed (simulated)
- [ ] "Play Again" button returns to PlaySetup

## API-Backed Flow (requires running API)
- [ ] Signup: creates player via `POST /v1/players`, stores account locally
- [ ] Login: restores stored account
- [ ] Dashboard: shows balance, deposit button opens Stripe checkout (test mode)
- [ ] Stripe webhook completes → balance refreshes on dashboard
- [ ] Lobby: select wager + player count, create game via `POST /v1/games`
- [ ] WaitingRoom: join game via `POST /v1/games/:id/join`
  - [ ] Escrow status shows "✓ Funded" after join
  - [ ] Escrow address truncated shown
  - [ ] Pool amount updates as players join
- [ ] Game activates at 2+ players → auto-navigate to GameBoard
- [ ] GameBoard: HUD shows "Pool 🔒" with "Locked in escrow"
- [ ] Move via arrow keys / WASD / mobile swipe → `POST /v1/games/:id/move`
- [ ] Error codes handled: PLAYER_ELIMINATED, TILE_IS_LAVA, OUT_OF_BOUNDS, GAME_NOT_ACTIVE, MISSING_IDEMPOTENCY_KEY, REQUEST_IN_FLIGHT
- [ ] Game resolves → navigates to GameOver with correct placement + payout
- [ ] Winner comparison uses `player_id` (not `publicKey`)
- [ ] GameOver: shows place, payout, pool breakdown, settlement status
- [ ] Fallback: if API doesn't return placements/payouts, client computes 70/30

## Identity & Error Handling
- [x] Error envelope parsed correctly: `body.error.code`, `body.error.message`
- [x] Player identity uses `player_id` as primary key (with `pubkey` fallback)
- [x] Winner check: `game.winner === playerId`
- [x] Idempotency errors handled in WaitingRoom + GameBoard
- [x] `Placement` and `Payout` types defined in `src/types.ts`

## Web3 Simulation UX
- [x] WaitingRoom: "Escrow: ✓ Funded" + truncated escrow address
- [x] GameBoard: "Pool 🔒 / Locked in escrow" in HUD
- [x] GameOver/MockGameOver: settlement animation (verify → process → complete)
- [x] "Settlement mode: simulated" label visible
- [x] Pool distribution table: 1st (70%) / 2nd (30%)

## API Team Handoff
- [x] `API_TEAM_REQUEST.md` drafted with endpoint spec
- [ ] Shared with API team and confirmed receipt
