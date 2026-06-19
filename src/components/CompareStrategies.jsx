import { useState, useMemo } from 'react'
import styles from './ToolCalc.module.css'
import compareStyles from './Compare.module.css'

function fmt(n) {
  return '$' + Math.abs(Math.round(n)).toLocaleString()
}

function simulatePayoff(debts, budget, strategy) {
  let bals = debts.map(d => ({ ...d, bal: d.balance }))
  const START_YEAR = 2026
  const START_MONTH = 6
  const MAX_MONTHS = 180
  let totalInterest = 0
  let months = 0

  if (strategy === 'smart') {
    bals.sort((a, b) => {
      const aPromo = a.apr === 0 && a.promoMonths > 0
      const bPromo = b.apr === 0 && b.promoMonths > 0
      if (!aPromo && !bPromo) return b.apr - a.apr
      if (aPromo && bPromo) return a.promoMonths - b.promoMonths
      if (!aPromo && bPromo) return -1
      return 1
    })
  } else if (strategy === 'avalanche') {
    bals.sort((a, b) => b.apr - a.apr)
  }

  for (let m = 0; m < MAX_MONTHS; m++) {
    bals.forEach(b => {
      if (b.bal > 0) {
        const promoActive = b.apr === 0 && b.promoMonths > m
        if (!promoActive && b.apr > 0) {
          const interest = b.bal * (b.apr / 100 / 12)
          b.bal += interest
          totalInterest += interest
        }
      }
    })

    let remaining = budget
    bals.forEach(b => {
      if (b.bal > 0) {
        const min = Math.min(b.bal, Math.max(25, b.bal * 0.02))
        b.bal = Math.max(0, b.bal - min)
        remaining -= min
      }
    })

    if (strategy !== 'minimum') {
      for (let i = 0; i < bals.length && remaining > 0; i++) {
        if (bals[i].bal > 0) {
          const pay = Math.min(bals[i].bal, remaining)
          bals[i].bal = Math.max(0, bals[i].bal - pay)
          remaining -= pay
        }
      }
    }

    months = m + 1
    if (bals.every(b => b.bal < 1)) break
  }

  const date = new Date(START_YEAR, START_MONTH + months, 1)
  const label = date.toLocaleString('default', { month: 'short', year: 'numeric' })

  return { months, label, totalInterest, paidOff: bals.every(b => b.bal < 1) }
}

export default function CompareStrategies() {
  const [debts, setDebts] = useState([
    { id: 1, name: '', balance: '', apr: '', promoMonths: 0 },
    { id: 2, name: '', balance: '', apr: '', promoMonths: 0 },
  ])
  const [budget, setBudget] = useState('')
  const [calculated, setCalculated] = useState(false)

  function updateDebt(i, field, val) {
    setDebts(debts.map((d, idx) => idx === i ? { ...d, [field]: val } : d))
    setCalculated(false)
  }

  function addDebt() {
    setDebts([...debts, { id: Date.now(), name: '', balance: '', apr: '', promoMonths: 0 }])
  }

  function removeDebt(i) {
    setDebts(debts.filter((_, idx) => idx !== i))
  }

  const results = useMemo(() => {
    if (!calculated) return null
    const active = debts
      .filter(d => d.name.trim() && parseFloat(d.balance) > 0)
      .map(d => ({
        ...d,
        balance: parseFloat(d.balance) || 0,
        apr: parseFloat(d.apr) || 0,
        promoMonths: parseInt(d.promoMonths) || 0,
      }))
    const b = parseFloat(budget) || 0
    if (!active.length || b <= 0) return null

    const smart = simulatePayoff(active, b, 'smart')
    const avalanche = simulatePayoff(active, b, 'avalanche')
    const minimum = simulatePayoff(active, b, 'minimum')

    return { smart, avalanche, minimum }
  }, [calculated, debts, budget])

  const totalDebt = debts.reduce((a, d) => a + (parseFloat(d.balance) || 0), 0)

  return (
    <div className={styles.calc}>
      <div className={styles.header}>
        <div className={styles.icon}>⚡</div>
        <div>
          <h2>Compare strategies</h2>
          <p>See exactly how much time and money you save by using balance transfers and hardship rates — versus just doing avalanche or minimum payments.</p>
        </div>
      </div>

      <div className={styles.insight}>
        <strong>Most people don't know there's a third option.</strong> Avalanche and snowball are fine. But combining a hardship rate negotiation and a balance transfer with focused payoff is a different league — this shows you the difference in real dollars and months.
      </div>

      <div className={compareStyles.debtList}>
        <div className={compareStyles.debtHeader}>
          <span>Name</span>
          <span>Balance</span>
          <span>APR %</span>
          <span>Promo months</span>
          <span />
        </div>
        {debts.map((d, i) => (
          <div key={d.id || i} className={compareStyles.debtRow}>
            <input type="text" placeholder="e.g. Chase card" value={d.name}
              onChange={e => updateDebt(i, 'name', e.target.value)} />
            <div className={compareStyles.prefixInput}>
              <span>$</span>
              <input type="number" placeholder="0" min="0" value={d.balance}
                onChange={e => updateDebt(i, 'balance', e.target.value)} />
            </div>
            <input type="number" placeholder="0" min="0" max="100" step="0.1" value={d.apr}
              onChange={e => updateDebt(i, 'apr', e.target.value)} />
            <input type="number" placeholder="0" min="0" max="60" value={d.promoMonths}
              onChange={e => updateDebt(i, 'promoMonths', parseInt(e.target.value) || 0)}
              disabled={parseFloat(d.apr) !== 0} />
            <button className={compareStyles.removeBtn} onClick={() => removeDebt(i)}
              disabled={debts.length === 1}>×</button>
          </div>
        ))}
        <button className={compareStyles.addBtn} onClick={addDebt}>+ Add debt</button>
      </div>

      <div className={compareStyles.budgetRow}>
        <label>Monthly attack budget</label>
        <div className={styles.inputWrap}>
          <span className={styles.pre}>$</span>
          <input type="number" placeholder="e.g. 800" min="1" step="10" value={budget}
            onChange={e => { setBudget(e.target.value); setCalculated(false) }} />
          <span className={styles.suf}>/mo</span>
        </div>
      </div>

      <button className={styles.calcBtn} onClick={() => setCalculated(true)}>
        Compare strategies →
      </button>

      {calculated && results && (
        <div className={compareStyles.results}>
          <div className={compareStyles.grid}>

            <div className={`${compareStyles.col} ${compareStyles.winner}`}>
              <div className={compareStyles.colBadge}>⚡ Your strategy</div>
              <div className={compareStyles.colTitle}>Balance transfer + hardship rate + focused payoff</div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Debt free</div>
                <div className={compareStyles.statValue}>{results.smart.label}</div>
              </div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Total interest paid</div>
                <div className={compareStyles.statValue}>{fmt(results.smart.totalInterest)}</div>
              </div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Months to freedom</div>
                <div className={compareStyles.statValue}>{results.smart.months}</div>
              </div>
              <div className={compareStyles.savings}>
                You save <strong>{fmt(results.minimum.totalInterest - results.smart.totalInterest)}</strong> vs. minimums only
              </div>
            </div>

            <div className={compareStyles.col}>
              <div className={compareStyles.colBadge}>🏔 Avalanche</div>
              <div className={compareStyles.colTitle}>Highest interest rate first, no transfers or hardship</div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Debt free</div>
                <div className={compareStyles.statValue}>{results.avalanche.label}</div>
              </div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Total interest paid</div>
                <div className={compareStyles.statValue}>{fmt(results.avalanche.totalInterest)}</div>
              </div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Months to freedom</div>
                <div className={compareStyles.statValue}>{results.avalanche.months}</div>
              </div>
              <div className={compareStyles.diff}>
                {results.smart.months < results.avalanche.months
                  ? `${results.avalanche.months - results.smart.months} months slower than your strategy`
                  : 'Similar timeline to your strategy'}
              </div>
            </div>

            <div className={compareStyles.col}>
              <div className={compareStyles.colBadge}>😬 Minimums only</div>
              <div className={compareStyles.colTitle}>Paying the minimum each month and nothing more</div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Debt free</div>
                <div className={compareStyles.statValue}>{results.minimum.paidOff ? results.minimum.label : '10+ years'}</div>
              </div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Total interest paid</div>
                <div className={compareStyles.statValue}>{fmt(results.minimum.totalInterest)}</div>
              </div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Months to freedom</div>
                <div className={compareStyles.statValue}>{results.minimum.paidOff ? results.minimum.months : '120+'}</div>
              </div>
              <div className={compareStyles.diff}>
                {results.minimum.months - results.smart.months > 0
                  ? `${results.minimum.months - results.smart.months} months slower than your strategy`
                  : ''}
              </div>
            </div>
          </div>

          <div className={compareStyles.bottomLine}>
            Starting from {fmt(totalDebt)} in debt — your strategy gets you out <strong>{results.minimum.months - results.smart.months} months faster</strong> and saves you <strong>{fmt(results.minimum.totalInterest - results.smart.totalInterest)}</strong> in interest compared to paying minimums.
          </div>
        </div>
      )}

      {calculated && !results && (
        <div className={styles.error}>Add at least one debt with a name and balance, and enter your monthly budget.</div>
      )}
    </div>
  )
}
