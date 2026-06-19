import { useState, useMemo } from 'react'
import styles from './ToolCalc.module.css'
import compareStyles from './Compare.module.css'

function fmt(n) {
  return '$' + Math.abs(Math.round(n)).toLocaleString()
}

function simulatePayoff(debts, budget) {
  let bals = debts.map(d => ({ ...d, bal: d.balance }))
  bals.sort((a, b) => {
    const aPromo = a.apr === 0 && a.promoMonths > 0
    const bPromo = b.apr === 0 && b.promoMonths > 0
    if (!aPromo && !bPromo) return b.apr - a.apr
    if (aPromo && bPromo) return a.promoMonths - b.promoMonths
    if (!aPromo && bPromo) return -1
    return 1
  })

  const MAX_MONTHS = 180
  let totalInterest = 0
  let months = 0

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

    for (let i = 0; i < bals.length && remaining > 0; i++) {
      if (bals[i].bal > 0) {
        const pay = Math.min(bals[i].bal, remaining)
        bals[i].bal = Math.max(0, bals[i].bal - pay)
        remaining -= pay
      }
    }

    months = m + 1
    if (bals.every(b => b.bal < 1)) break
  }

  const START_YEAR = 2026
  const START_MONTH = 6
  const date = new Date(START_YEAR, START_MONTH + months, 1)
  const label = date.toLocaleString('default', { month: 'short', year: 'numeric' })
  return { months, label, totalInterest }
}

function simulateMinimums(debts) {
  let bals = debts.map(d => ({ ...d, bal: d.balance }))
  const MAX_MONTHS = 180
  let totalInterest = 0
  let months = 0

  for (let m = 0; m < MAX_MONTHS; m++) {
    bals.forEach(b => {
      if (b.bal > 0 && b.apr > 0) {
        const interest = b.bal * (b.apr / 100 / 12)
        b.bal += interest
        totalInterest += interest
      }
    })
    bals.forEach(b => {
      if (b.bal > 0) {
        const min = Math.min(b.bal, Math.max(25, b.bal * 0.02))
        b.bal = Math.max(0, b.bal - min)
      }
    })
    months = m + 1
    if (bals.every(b => b.bal < 1)) break
  }

  const START_YEAR = 2026
  const START_MONTH = 6
  const date = new Date(START_YEAR, START_MONTH + months, 1)
  const label = date.toLocaleString('default', { month: 'short', year: 'numeric' })
  return { months, label, totalInterest }
}

const EMPTY_DEBT = { name: '', balance: '', apr: '', action: 'asis', transferFee: '3', transferMonths: '18', hardshipApr: '5.9' }

export default function CompareStrategies() {
  const [debts, setDebts] = useState([
    { ...EMPTY_DEBT, id: 1 },
    { ...EMPTY_DEBT, id: 2 },
  ])
  const [budget, setBudget] = useState('')
  const [calculated, setCalculated] = useState(false)

  function updateDebt(i, field, val) {
    setDebts(debts.map((d, idx) => idx === i ? { ...d, [field]: val } : d))
    setCalculated(false)
  }

  function addDebt() {
    setDebts([...debts, { ...EMPTY_DEBT, id: Date.now() }])
  }

  function removeDebt(i) {
    setDebts(debts.filter((_, idx) => idx !== i))
  }

  const results = useMemo(() => {
    if (!calculated) return null
    const active = debts.filter(d => d.name.trim() && parseFloat(d.balance) > 0)
    const b = parseFloat(budget) || 0
    if (!active.length || b <= 0) return null

    const todayDebts = active.map(d => ({
      name: d.name,
      balance: parseFloat(d.balance),
      apr: parseFloat(d.apr) || 0,
      promoMonths: 0,
    }))

    const withMovesDebts = active.map(d => {
      const balance = parseFloat(d.balance)
      const apr = parseFloat(d.apr) || 0

      if (d.action === 'transfer') {
        const fee = parseFloat(d.transferFee) / 100 || 0.03
        const months = parseInt(d.transferMonths) || 18
        return { name: d.name, balance: balance * (1 + fee), apr: 0, promoMonths: months }
      } else if (d.action === 'hardship') {
        return { name: d.name, balance, apr: parseFloat(d.hardshipApr) || 5.9, promoMonths: 0 }
      } else {
        return { name: d.name, balance, apr, promoMonths: 0 }
      }
    })

    const today = simulatePayoff(todayDebts, b)
    const withMoves = simulatePayoff(withMovesDebts, b)
    const minimums = simulateMinimums(todayDebts)
    const totalDebt = active.reduce((a, d) => a + parseFloat(d.balance), 0)

    return { today, withMoves, minimums, totalDebt }
  }, [calculated, debts, budget])

  return (
    <div className={styles.calc}>
      <div className={styles.header}>
        <div className={styles.icon}>⚡</div>
        <div>
          <h2>Compare strategies</h2>
          <p>Enter your debts, choose what move you'd make on each one, and see exactly how much time and money you save.</p>
        </div>
      </div>

      <div className={styles.insight}>
        <strong>This is the move most people never make.</strong> For each debt you can: leave it as is, move it to a 0% balance transfer card, or call and ask for a hardship rate. Mix and match — then see the real difference side by side.
      </div>

      <div className={compareStyles.debtList}>
        {debts.map((d, i) => (
          <div key={d.id || i} className={compareStyles.debtCard}>
            <div className={compareStyles.debtCardTop}>
              <input type="text" placeholder="Card or loan name" value={d.name}
                className={compareStyles.nameInput}
                onChange={e => updateDebt(i, 'name', e.target.value)} />
              <div className={compareStyles.prefixInput}>
                <span>$</span>
                <input type="number" placeholder="Balance" min="0" value={d.balance}
                  onChange={e => updateDebt(i, 'balance', e.target.value)} />
              </div>
              <div className={compareStyles.suffixInput}>
                <input type="number" placeholder="APR" min="0" max="100" step="0.1" value={d.apr}
                  onChange={e => updateDebt(i, 'apr', e.target.value)} />
                <span>%</span>
              </div>
              <button className={compareStyles.removeBtn} onClick={() => removeDebt(i)}
                disabled={debts.length === 1}>×</button>
            </div>

            <div className={compareStyles.actionRow}>
              <span className={compareStyles.actionLabel}>What's your move?</span>
              <div className={compareStyles.actionBtns}>
                {[
                  { val: 'asis', label: '🔒 Leave as is' },
                  { val: 'transfer', label: '⟲ Balance transfer' },
                  { val: 'hardship', label: '📞 Call for hardship' },
                ].map(opt => (
                  <button key={opt.val}
                    className={`${compareStyles.actionBtn} ${d.action === opt.val ? compareStyles.actionBtnActive : ''}`}
                    onClick={() => updateDebt(i, 'action', opt.val)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {d.action === 'transfer' && (
              <div className={compareStyles.actionDetails}>
                <div className={compareStyles.detailField}>
                  <label>Transfer fee</label>
                  <div className={compareStyles.suffixInput}>
                    <input type="number" placeholder="3" min="0" max="10" step="0.5"
                      value={d.transferFee}
                      onChange={e => updateDebt(i, 'transferFee', e.target.value)} />
                    <span>%</span>
                  </div>
                </div>
                <div className={compareStyles.detailField}>
                  <label>Promo window</label>
                  <div className={compareStyles.suffixInput}>
                    <input type="number" placeholder="18" min="6" max="24"
                      value={d.transferMonths}
                      onChange={e => updateDebt(i, 'transferMonths', e.target.value)} />
                    <span>mo</span>
                  </div>
                </div>
                <div className={compareStyles.detailNote}>
                  100% of every payment hits principal during the 0% window
                </div>
              </div>
            )}

            {d.action === 'hardship' && (
              <div className={compareStyles.actionDetails}>
                <div className={compareStyles.detailField}>
                  <label>Hardship rate offered</label>
                  <div className={compareStyles.suffixInput}>
                    <input type="number" placeholder="5.9" min="0" max="20" step="0.1"
                      value={d.hardshipApr}
                      onChange={e => updateDebt(i, 'hardshipApr', e.target.value)} />
                    <span>%</span>
                  </div>
                </div>
                <div className={compareStyles.detailNote}>
                  Account closes but rate drops dramatically — freed cash attacks your other debt
                </div>
              </div>
            )}
          </div>
        ))}
        <button className={compareStyles.addBtn} onClick={addDebt}>+ Add another debt</button>
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
              <div className={compareStyles.colBadge}>⚡ With your moves</div>
              <div className={compareStyles.colTitle}>After balance transfers + hardship calls</div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Debt free</div>
                <div className={compareStyles.statValue}>{results.withMoves.label}</div>
              </div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Total interest paid</div>
                <div className={compareStyles.statValue}>{fmt(results.withMoves.totalInterest)}</div>
              </div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Months to freedom</div>
                <div className={compareStyles.statValue}>{results.withMoves.months}</div>
              </div>
              <div className={compareStyles.savings}>
                You save <strong>{fmt(results.minimums.totalInterest - results.withMoves.totalInterest)}</strong> vs. minimums only
              </div>
            </div>

            <div className={compareStyles.col}>
              <div className={compareStyles.colBadge}>📋 Today's debts, no moves</div>
              <div className={compareStyles.colTitle}>Keep current rates, focused payoff only</div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Debt free</div>
                <div className={compareStyles.statValue}>{results.today.label}</div>
              </div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Total interest paid</div>
                <div className={compareStyles.statValue}>{fmt(results.today.totalInterest)}</div>
              </div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Months to freedom</div>
                <div className={compareStyles.statValue}>{results.today.months}</div>
              </div>
              <div className={compareStyles.diff}>
                {results.today.months - results.withMoves.months > 0
                  ? `${results.today.months - results.withMoves.months} months slower than making your moves`
                  : 'Similar timeline'}
              </div>
            </div>

            <div className={compareStyles.col}>
              <div className={compareStyles.colBadge}>😬 Minimums only</div>
              <div className={compareStyles.colTitle}>Paying the minimum each month, no strategy</div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Debt free</div>
                <div className={compareStyles.statValue}>{results.minimums.label}</div>
              </div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Total interest paid</div>
                <div className={compareStyles.statValue}>{fmt(results.minimums.totalInterest)}</div>
              </div>
              <div className={compareStyles.stat}>
                <div className={compareStyles.statLabel}>Months to freedom</div>
                <div className={compareStyles.statValue}>{results.minimums.months}</div>
              </div>
              <div className={compareStyles.diff}>
                {results.minimums.months - results.withMoves.months > 0
                  ? `${results.minimums.months - results.withMoves.months} months slower than making your moves`
                  : ''}
              </div>
            </div>
          </div>

          <div className={compareStyles.bottomLine}>
            Starting from {fmt(results.totalDebt)} in debt — making your moves gets you out <strong>{results.minimums.months - results.withMoves.months} months faster</strong> and saves <strong>{fmt(results.minimums.totalInterest - results.withMoves.totalInterest)}</strong> in interest vs. paying minimums.
          </div>
        </div>
      )}

      {calculated && !results && (
        <div className={styles.error}>Add at least one debt with a name and balance, and enter your monthly budget.</div>
      )}
    </div>
  )
}
