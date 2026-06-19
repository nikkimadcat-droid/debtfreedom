import { useState, useMemo } from 'react'
import styles from './ToolCalc.module.css'

function fmt(n) {
  return '$' + Math.abs(Math.round(n)).toLocaleString()
}

export default function HardshipCalc() {
  const [balance, setBalance] = useState('')
  const [currentApr, setCurrentApr] = useState('')
  const [hardshipApr, setHardshipApr] = useState('5.9')
  const [months, setMonths] = useState('48')
  const [calculated, setCalculated] = useState(false)

  const result = useMemo(() => {
    const b = parseFloat(balance)
    const ca = parseFloat(currentApr) / 100 / 12
    const ha = parseFloat(hardshipApr) / 100 / 12
    const m = parseInt(months)
    if (!b || !ca || !ha || !m) return null

    const hardshipPayment = (b * ha) / (1 - Math.pow(1 + ha, -m))
    const currentPayment = (b * ca) / (1 - Math.pow(1 + ca, -m))

    let totalInterestCurrent = 0
    let bal = b
    for (let i = 0; i < m * 3; i++) {
      if (bal <= 0) break
      const interest = bal * ca
      totalInterestCurrent += interest
      bal = bal + interest - currentPayment
      if (bal < 0) bal = 0
    }

    let totalInterestHardship = 0
    bal = b
    for (let i = 0; i < m; i++) {
      if (bal <= 0) break
      const interest = bal * ha
      totalInterestHardship += interest
      bal = bal + interest - hardshipPayment
      if (bal < 0) bal = 0
    }

    const monthlySavings = currentPayment - hardshipPayment
    const interestSaved = totalInterestCurrent - totalInterestHardship
    const cashFreed = monthlySavings

    return {
      currentPayment,
      hardshipPayment,
      monthlySavings,
      interestSaved,
      cashFreed,
      totalInterestCurrent,
      totalInterestHardship,
    }
  }, [balance, currentApr, hardshipApr, months])

  return (
    <div className={styles.calc}>
      <div className={styles.header}>
        <div className={styles.icon}>📞</div>
        <div>
          <h2>Hardship rate calculator</h2>
          <p>See exactly how much you save — and how much cash flow you free up — by calling your credit card company and asking for a hardship rate.</p>
        </div>
      </div>

      <div className={styles.insight}>
        <strong>The call most people never make:</strong> You can call your credit card company and ask to enroll in their hardship program. They drop your rate from 20%+ down to around 5–6%. Yes, they close the account — but your rate drops dramatically and your minimum payment drops too. That freed-up cash goes straight at your other debt.
      </div>

      <div className={styles.scriptBox}>
        <div className={styles.scriptLabel}>What to say when you call:</div>
        <div className={styles.script}>
          "Hi, I'm having some financial difficulty and I'd like to ask about enrolling in your hardship program. I want to pay this off but I need a lower interest rate to do that."
        </div>
        <div className={styles.scriptNote}>That's it. Stay calm, be direct. They have these programs — they just don't advertise them. If the first rep says no, ask to speak to a supervisor or call back and try again.</div>
      </div>

      <div className={styles.fields}>
        <div className={styles.field}>
          <label>Current balance</label>
          <div className={styles.inputWrap}>
            <span className={styles.pre}>$</span>
            <input type="number" placeholder="e.g. 8000" min="0" value={balance} onChange={e => { setBalance(e.target.value); setCalculated(false) }} />
          </div>
        </div>
        <div className={styles.field}>
          <label>Current APR</label>
          <div className={styles.inputWrap}>
            <input type="number" placeholder="e.g. 26" min="0" max="60" value={currentApr} onChange={e => { setCurrentApr(e.target.value); setCalculated(false) }} />
            <span className={styles.suf}>%</span>
          </div>
        </div>
        <div className={styles.field}>
          <label>Hardship rate offered</label>
          <div className={styles.inputWrap}>
            <input type="number" placeholder="5.9" min="0" max="20" step="0.1" value={hardshipApr} onChange={e => { setHardshipApr(e.target.value); setCalculated(false) }} />
            <span className={styles.suf}>%</span>
          </div>
          <span className={styles.fieldHint}>Typical range: 5–9%. Enter what they offer you.</span>
        </div>
        <div className={styles.field}>
          <label>Payoff timeframe</label>
          <div className={styles.inputWrap}>
            <input type="number" placeholder="48" min="12" max="84" value={months} onChange={e => { setMonths(e.target.value); setCalculated(false) }} />
            <span className={styles.suf}>months</span>
          </div>
          <span className={styles.fieldHint}>Hardship programs typically run 48–60 months.</span>
        </div>
      </div>

      <button className={styles.calcBtn} onClick={() => setCalculated(true)}>
        Calculate →
      </button>

      {calculated && result && (
        <div className={styles.results}>
          <div className={styles.verdict} data-good="true">
            ✓ Making this call could save you {fmt(result.interestSaved)} in interest
          </div>

          <div className={styles.metrics}>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Current monthly payment</div>
              <div className={styles.metricValue}>{fmt(result.currentPayment)}</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Hardship monthly payment</div>
              <div className={styles.metricValue}>{fmt(result.hardshipPayment)}</div>
            </div>
            <div className={`${styles.metric} ${styles.highlight}`}>
              <div className={styles.metricLabel}>Cash freed up each month</div>
              <div className={styles.metricValue}>{fmt(result.cashFreed)}</div>
            </div>
          </div>

          <div className={styles.paymentBox}>
            <div className={styles.paymentLabel}>What to do with that freed-up cash</div>
            <div className={styles.paymentTip}>
              That <strong>{fmt(result.cashFreed)}/month</strong> doesn't go in your pocket — it goes straight at your highest-interest card. This is how you fight on two fronts at once: one card on a managed hardship plan, every extra dollar attacking the next one.
            </div>
          </div>

          <div className={styles.breakeven}>
            Total interest saved vs. staying at your current rate: <strong>{fmt(result.interestSaved)}</strong>
          </div>
        </div>
      )}

      {calculated && !result && (
        <div className={styles.error}>Fill in all fields to see your results.</div>
      )}
    </div>
  )
}
