# Temporary API Context Ingestion (Splice) — Updated

Imported source:
- `tmp/hackillinois2026-api/` (cloned from `https://github.com/ExtraMediumDev/hackillinois2026.git`)
- Pull latest: `cd tmp/hackillinois2026-api && git pull origin master`

## Integration reference

**Full integration guide:** `tmp/hackillinois2026-api/docs/GAME_INTEGRATION_GUIDE.md`

## Implemented endpoint surface

### Players / wallet
- `POST /v1/players`
- `GET /v1/players/:id`
- `POST /v1/players/:id/checkout-session`
- `POST /v1/players/:id/connect`
- `POST /v1/players/:id/cashout`

### Games
- `POST /v1/games`
- `GET /v1/games/:id`
- `POST /v1/games/:id/join` — supports `force_start: true` for single-player / demo
- `POST /v1/games/:id/start` — optional, alternative to force_start
- `POST /v1/games/:id/move` — grid games only
- `POST /v1/games/:id/resolve` — client-authoritative games

### Webhooks
- `POST /v1/webhooks/stripe`

## Frontend alignment

- `joinGame(gameId, playerId, { force_start: true })` — used in FundedCallback for 1-player + bots flow
- `resolveGame(gameId, winner, placements, { distribution })` — Idempotency-Key + distribution supported
- `player_id` is canonical; winner, placements, payouts use `player_id`

## Error envelope

```json
{
  "status": "error",
  "statusCode": 409,
  "error": { "code": "...", "message": "...", "remediation": "..." }
}
```

Codes: `GAME_NOT_FOUND`, `PLAYER_NOT_FOUND`, `INSUFFICIENT_FUNDS`, `GAME_FULL`, `GAME_NOT_JOINABLE`, `GAME_NOT_ACTIVE`, `GAME_ALREADY_RESOLVED`, `INVALID_WINNER`, `MISSING_IDEMPOTENCY_KEY`, `REQUEST_IN_FLIGHT`, etc.

## Cleanup

```bash
rm -rf tmp/hackillinois2026-api
```
