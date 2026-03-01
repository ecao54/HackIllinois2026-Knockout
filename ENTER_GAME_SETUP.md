# Getting "Enter Game" to Work

"Enter Game" redirects to Stripe checkout, then to the game. You need the API running and configured.

---

## What You Need to Do

### 1. Configure the frontend `.env`

Create `.env` in this repo (or run `npm run setup`):

```
VITE_API_URL=<API base URL — see below>
VITE_API_KEY=<API key — see below>
```

Restart the dev server (`npm run dev`) after changing `.env`.

### 2. Start the game frontend

```bash
npm install
npm run setup
npm run dev
```

---

## Balance Not Updating After a Win?

If balance stays stale after winning (e.g. still shows $0.50 instead of $1.10), the API needs to credit the winner's balance when `resolve` is called. Share [API_TEAM_BALANCE_README.md](API_TEAM_BALANCE_README.md) with the API team.

---

## What You Need From the API Team

Ask them for:

1. **API base URL** — e.g. `http://localhost:3000` (local) or `https://your-api.example.com` (deployed).
2. **API key** — The value for the `X-API-Key` header. Must match what the API server has in its `API_KEY` env var.

Copy-paste message:

```
For the Penguin Knockout frontend to use "Enter Game" (Stripe checkout → game flow), I need:

1. API base URL — where the Splice API is reachable (e.g. http://localhost:3000 for local, or your deployed URL).
2. API key — the X-API-Key value that the API accepts. I'll put it in my frontend's VITE_API_KEY env var.

Once I have these, I'll add them to .env and the flow should work.
```

---

## Option A: You Run the API Locally

If you run the API yourself:

1. Clone: `git clone https://github.com/ExtraMediumDev/hackillinois2026.git`
2. `cd hackillinois2026/api && npm install`
3. Copy `api/.env.example` to `api/.env` and fill it in (Redis, Stripe, etc. — see API repo README)
4. Set `API_KEY=dev-api-key-change-in-production` in `api/.env`
5. Run `npm run dev` in the api folder
6. In this game repo: `.env` with `VITE_API_URL=http://localhost:3000` and `VITE_API_KEY=dev-api-key-change-in-production`

---

## Option B: API Team Deploys and Shares Credentials

If the API is deployed, they give you:
- `VITE_API_URL=https://their-deployed-api.com`
- `VITE_API_KEY=<their key>`

Put those in `.env` and you're done.
