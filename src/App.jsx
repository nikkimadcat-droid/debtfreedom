import { useState, useCallback } from 'react'
import DebtForm from './components/DebtForm.jsx'
import Results from './components/Results.jsx'
import BalanceTransferCalc from './components/BalanceTransferCalc.jsx'
import HardshipCalc from './components/HardshipCalc.jsx'
import CompareStrategies from './components/CompareStrategies.jsx'
import { calculatePayoff } from './calcEngine.js'
import styles from './App.module.css'

const DEFAULT_DEBTS = [
  { id: 1, name: '', balance: '', apr: '', promoMonths: 0 },
  { id: 2, name: '', balance: '', apr: '', promoMonths: 0 },
]

function parseDebts(debts) {
  return debts.map(d => ({
    ...d,
    balance: parseFloat(d.balance) || 0,
    apr: parseFloat(d.apr) || 0,
    promoMonths: parseInt(d.promoMonths) || 0,
  }))
}

const TABS = [
  { id: 'planner', label: 'Payoff planner' },
  { id: 'transfer', label: 'Balance transfer' },
  { id: 'hardship', label: 'Hardship rate' },
  { id: 'compare', label: 'Compare strategies' },
]

export default function App() {
  const [tab, setTab] = useState('planner')
  const [debts, setDebts] = useState(DEFAULT_DEBTS)
  const [budget, setBudget] = useState('')
  const [result, setResult] = useState(null)
  const [calculated, setCalculated] = useState(false)
  const [error, setError] = useState('')

  const handleCalculate = useCallback(() => {
    setError('')
    const parsed = parseDebts(debts)
    const b = parseFloat(budget) || 0

    if (!parsed.some(d => d.balance > 0 && d.name.trim())) {
      setError('Please add at least one debt with a name and balance.')
      return
    }
    if (b <= 0) {
      setError('Please enter your monthly attack budget.')
      return
    }

    const res = calculatePayoff(parsed, b)
    setResult(res)
    setCalculated(true)

    setTimeout(() => {
      document.getElementById('results-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }, [debts, budget])

  const handleReset = () => {
    setDebts(DEFAULT_DEBTS)
    setBudget('')
    setResult(null)
    setCalculated(false)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>→0</span>
            <span className={styles.logoText}>Debt freedom planner</span>
          </div>
          <span className={styles.tagline}>Free. No account. No upsells.</span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.headline}>
            Find out exactly when you'll be debt free.
          </h1>
          <p className={styles.sub}>
            Enter your balances. Enter your monthly budget. Get a month-by-month plan — 
            with the right payoff order to save the most in interest. Plus two tools most people don't know exist.
          </p>
        </div>

        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'planner' && (
          <>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Your debts</h2>
                <p>Include credit cards, loans, HELOCs — anything you're paying down. Set APR to 0 for promotional 0% cards.</p>
              </div>
              <DebtForm debts={debts} onChange={setDebts} />
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Monthly attack budget</h2>
                <p>How much can you put toward debt each month — after rent/mortgage, utilities, food, and other fixed bills?</p>
              </div>
              <div className={styles.budgetRow}>
                <div className={styles.budgetInput}>
                  <span className={styles.dollar}>$</span>
                  <input
                    type="number"
                    placeholder="e.g. 800"
                    min="1"
                    step="10"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCalculate()}
                    aria-label="Monthly attack budget in dollars"
                  />
                  <span className={styles.perMonth}>/month</span>
                </div>
                <p className={styles.budgetHint}>
                  Even $50 extra per month makes a real difference in payoff time.
                </p>
              </div>
            </div>

            {error && (
              <div className={styles.error} role="alert">{error}</div>
            )}

            <button className={styles.calcBtn} onClick={handleCalculate}>
              Show my payoff plan →
            </button>

            <div id="results-anchor" />

            {calculated && result && (
              <div className={styles.resultsWrap}>
                <div className={styles.resultsHeader}>
                  <h2>Your payoff plan</h2>
                  <button className={styles.resetBtn} onClick={handleReset}>Start over</button>
                </div>
                <Results result={result} />
              </div>
            )}

            {calculated && !result && (
              <div className={styles.noResult}>
                Something doesn't add up — check your balances and budget and try again.
              </div>
            )}
          </>
        )}

        {tab === 'transfer' && <BalanceTransferCalc />}
        {tab === 'hardship' && <HardshipCalc />}
        {tab === 'compare' && <CompareStrategies />}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>
            Built by someone who paid off debt the hard way — balance transfers, hardship rate negotiations, and a plan.
            This tool is free because the people who need it most shouldn't have to pay for it.
          </p>
          <p className={styles.footerSmall}>
            Results are estimates. Interest calculations assume monthly compounding. 
            Minimum payments estimated at 2% of balance (min $25). Always verify with your lenders.
            This is not financial advice.
          </p>
        </div>
      </footer>
    </div>
  )
}
