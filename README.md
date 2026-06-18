# Debt Freedom Planner

A free, no-account debt payoff calculator. Enter your balances, enter your monthly budget, get a month-by-month plan with the optimal payoff order to minimize interest paid.

**Live demo:** [deploy to Vercel and add URL here]

## Features

- Optimal payoff sequencing (high-interest first, then shortest 0% promo windows)
- Month-by-month timeline with balances for every account
- Year-by-year snapshot table
- Interest savings vs. minimum payments only
- Debt-free date and time estimate
- Works on mobile
- No account, no tracking, no fees — ever

## Tech stack

- React 18
- Vite
- Recharts (charting)
- CSS Modules

## Local development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173

## Deploy to Vercel (free)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "Add New Project" → import your repo
4. Leave all settings as default (Vite is auto-detected)
5. Click Deploy

That's it. Vercel gives you a free URL you can share.

## Customization

**Change the start date** — edit `START_YEAR` and `START_MONTH` in `src/calcEngine.js`

**Change minimum payment logic** — edit the min payment calculation in `calculatePayoff()` in `src/calcEngine.js` (currently 2% of balance or $25, whichever is higher)

**Change colors/fonts** — edit CSS variables in `src/index.css`

## The story behind this

Built by someone who paid off significant debt using balance transfers, a hardship rate negotiation with a credit card company, and a disciplined payoff sequence. Most debt calculators either charge fees or bury you in upsells. This one doesn't. The people who need this tool the most shouldn't have to pay for it.

## License

MIT — use it, fork it, improve it.
