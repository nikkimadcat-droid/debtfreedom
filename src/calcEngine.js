// Simulate debt payoff month by month
// Strategy: highest APR first, then shortest promo window, then lowest APR
// Returns array of monthly snapshots plus summary stats

export function calculatePayoff(debts, monthlyBudget) {
  const active = debts.filter(d => d.balance > 0 && d.name.trim())
  if (!active.length || monthlyBudget <= 0) return null

  // Sort order: high APR interest first, then promo (shortest window), then low APR
  const sorted = [...active].sort((a, b) => {
    const aIsPromo = a.apr === 0 && a.promoMonths > 0
    const bIsPromo = b.apr === 0 && b.promoMonths > 0
    if (!aIsPromo && !bIsPromo) return b.apr - a.apr
    if (aIsPromo && bIsPromo) return a.promoMonths - b.promoMonths
    if (!aIsPromo && bIsPromo) return -1
    return 1
  })

  let bals = sorted.map(d => ({ ...d, bal: d.balance, paid: 0, interestPaid: 0 }))
  const monthly = []
  const START_YEAR = 2026
  const START_MONTH = 6 // July (0-indexed)
  const MAX_MONTHS = 180
  let totalInterest = 0

  for (let m = 0; m < MAX_MONTHS; m++) {
    const date = new Date(START_YEAR, START_MONTH + m, 1)
    const label = date.toLocaleString('default', { month: 'short', year: 'numeric' })

    // Accrue interest on non-promo balances
    bals.forEach(b => {
      if (b.bal > 0) {
        const promoActive = b.apr === 0 && b.promoMonths > m
        if (!promoActive && b.apr > 0) {
          const interest = b.bal * (b.apr / 100 / 12)
          b.bal += interest
          b.interestPaid += interest
          totalInterest += interest
        }
      }
    })

    // Pay minimums on all (2% of balance, min $25, max balance)
    let remaining = monthlyBudget
    bals.forEach(b => {
      if (b.bal > 0) {
        const min = Math.min(b.bal, Math.max(25, b.bal * 0.02))
        b.bal = Math.max(0, b.bal - min)
        b.paid += min
        remaining -= min
      }
    })

    // Attack highest priority with leftover
    for (let i = 0; i < bals.length && remaining > 0; i++) {
      if (bals[i].bal > 0) {
        const pay = Math.min(bals[i].bal, remaining)
        bals[i].bal = Math.max(0, bals[i].bal - pay)
        bals[i].paid += pay
        remaining -= pay
      }
    }

    const snap = bals.map(b => Math.max(0, b.bal))
    const total = snap.reduce((a, c) => a + c, 0)
    monthly.push({ label, snap: [...snap], total, month: m })

    if (total < 1) break
  }

  const payoffIdx = monthly.findIndex(m => m.total < 1)
  const payoffLabel = payoffIdx >= 0 ? monthly[payoffIdx].label : '10+ years'

  // What-if: minimum payments only
  let minOnlyInterest = 0
  let minBals = active.map(d => ({ ...d, bal: d.balance }))
  for (let m = 0; m < MAX_MONTHS; m++) {
    minBals.forEach(b => {
      if (b.bal > 0) {
        const promoActive = b.apr === 0 && b.promoMonths > m
        if (!promoActive && b.apr > 0) {
          const interest = b.bal * (b.apr / 100 / 12)
          b.bal += interest
          minOnlyInterest += interest
        }
        const min = Math.min(b.bal, Math.max(25, b.bal * 0.02))
        b.bal = Math.max(0, b.bal - min)
      }
    })
    if (minBals.every(b => b.bal < 1)) break
  }

  const interestSaved = Math.max(0, minOnlyInterest - totalInterest)

  // Payoff order with dates
  const payoffOrder = sorted.map((d, i) => {
    const idx = monthly.findIndex(m => m.snap[i] < 1)
    return {
      ...d,
      payoffLabel: idx >= 0 ? monthly[idx].label : 'Not in window',
      payoffMonth: idx,
    }
  })

  // Yearly snapshots
  const yearlySnaps = []
  const seenYears = new Set()
  monthly.forEach(m => {
    const yr = m.label.split(' ')[1]
    if (!seenYears.has(yr)) {
      seenYears.add(yr)
      yearlySnaps.push(m)
    }
  })
  // Always include final month if not already there
  const last = monthly[monthly.length - 1]
  if (last && !yearlySnaps.find(y => y.label === last.label)) {
    yearlySnaps.push(last)
  }

  return {
    sorted,
    monthly,
    yearlySnaps,
    payoffLabel,
    payoffMonths: payoffIdx >= 0 ? payoffIdx : MAX_MONTHS,
    totalInterest,
    interestSaved,
    payoffOrder,
    totalDebt: active.reduce((a, d) => a + d.balance, 0),
  }
}
