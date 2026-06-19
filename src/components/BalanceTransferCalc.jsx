import { useState, useMemo } from 'react'
import styles from './ToolCalc.module.css'

function fmt(n) {
  return '$' + Math.abs(Math.round(n)).toLocaleString()
}

export default function BalanceTransferCalc() {
  const [balance, setBalance] = useState('')
  const [apr, setApr] = useState('')
  const [fee, setFee] = useState('3')
  const [months, setMonths] = useState('18')
  const [calculated, setCalculated] = useState(false)

  const result = useMemo(() => {
    const b = parseFloat(balance)
    const a = parseFloat(apr)
    const f = parseFloat(fee) / 100
    const m = parseInt(months)
    if (!b || !a || !f || !m) return null

    const transferFee = b * f
    const newBalance = b + transferFee
    const requiredPayment = newBalance / m
    const paddedPayment = requiredPayment * 1.05

    let remainingBalance = b
    let interestWithoutTransfer = 0
    const monthlyRate = a / 100 / 12
    for (let i = 0; i < m; i++) {
      const interest = remainingBalance * monthlyRate
      interestWithoutTransfer += interest
      const payment = Math.min(remainingBalance + interest, requiredPayment)
      remainingBalance = Math.max(0, remainingBalance + interest - payment)
    }

    const netSavings = interestWithoutTransfer - transferFee
    const monthlySavings = interestWithoutTransfer / m
    const breakEven = Math.ceil(transferFee / monthlySavings)

    return {
      transferFee,
      newBalance,
      requiredPayment,
      paddedPayment,
      interestWithoutTransfer,
      netSavings,
      breakEven,
      worthIt: netSavings > 0,
    }
  }, [balance, apr, fee, months])

  return (
    <div className={styles.calc}>
      <div className={styles.header}>
        <div className={styles.icon}>⟲</div>
        <div>
          <h2>Balance transfer calculator</h2>
          <p>Find out if moving your debt to a 0% promo card is worth it — and exactly what to pay each month to clear it in time.</p>
        </div>
      </div>

      <div className={styles.insight}>
        <strong>The move most people don't know:</strong> During a 0% promo window, 100% of every payment goes to your principal balance. On a 26% card, a huge chunk just feeds interest. A balance transfer buys you time and lets every dollar actually count.
      </div>

      <div className={styles.fields}>
        <div className={styles.field}>
          <label>Current balance you want to transfer</label>
          <div className={styles.inputWrap}>
            <span className={styles.pre}>$</span>
            <input type="number" placeholder="e.g. 5000" min="0" value={balance} onChange={e => { setBalance(e.target.value); setCalculated(false) }} />
          </div>
        </div>
        <div className={styles.field}>
          <label>Current APR on that card</label>
          <div className={styles.inputWrap}>
            <input type="number" placeholder="e.g. 26" min="0" max="100" value={apr} onChange={e => { setApr(e.target.value); setCalculated(false) }} />
            <span className={styles.suf}>%</span>
          </div>
        </div>
        <div className={styles.field}>
          <label>Balance transfer fee</label>
          <div className={styles.inputWrap}>
            <input type="number" placeholder="3" min="0" max="10" step="0.5" value={fee} onChange={e => { setFee(e.target.value); setCalculated(false) }} />
            <span className={styles.suf}>%</span>
          </div>
          <span className={styles.fieldHint}>Usually 3–5%. Check your offer.</span>
        </div>
        <div className={styles.field}>
          <label>0% promo window length</label>
          <div className={styles.inputWrap}>
            <input type="number" placeholder="18" min="6" max="24" value={months} onChange={e => { setMonths(e.target.value); setCalculated(false) }} />
            <span className={styles.suf}>months</span>
          </div>
          <span className={styles.fieldHint}>Common offers: 12, 15, 18, or 21 months.</span>
        </div>
      </div>

      <button className={styles.calcBtn} onClick={() => setCalculated(true)}>
        Calculate →
      </button>

      {calculated && result && (
        <div className={styles.results}>
          <div className={styles.verdict} data-good={result.worthIt}>
            {result.worthIt
              ? '✓ This transfer is worth it'
              : '✗ The fee may not be worth it at this rate'}
          </div>

          <div className={styles.metrics}>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Transfer fee you'll pay</div>
              <div className={styles.metricValue}>{fmt(result.transferFee)}</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Interest you'd pay staying put</div>
              <div className={styles.metricValue}>{fmt(result.interestWithoutTransfer)}</div>
            </div>
            <div className={`${styles.metric} ${styles.highlight}`}>
              <div className={styles.metricLabel}>Net savings with transfer</div>
              <div className={styles.metricValue}>{fmt(result.netSavings)}</div>
            </div>
          </div>

          <div className={styles.paymentBox}>
            <div className={styles.paymentLabel}>Required monthly payment to clear in {months} months</div>
            <div className={styles.paymentAmount}>{fmt(result.requiredPayment)}<span>/month</span></div>
            <div className={styles.paymentPadded}>
              Want a cushion? Pay <strong>{fmt(result.paddedPayment)}/month</strong> and you'll clear it with room to spare.
            </div>
            <div className={styles.paymentTip}>
              Set this as an automatic payment. Don't touch it. Point every extra dollar you have at your other high-interest debt — that's where the real battle is during this window.
            </div>
          </div>

          <div className={styles.breakeven}>
            The transfer fee pays for itself in <strong>{result.breakEven} months</strong> of interest savings.
          </div>
        </div>
      )}

      {calculated && !result && (
        <div className={styles.error}>Fill in all fields to see your results.</div>
      )}
    </div>
  )
}
