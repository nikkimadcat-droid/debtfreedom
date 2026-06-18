import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import styles from './Results.module.css'

function fmt(n) {
  return '$' + Math.round(n).toLocaleString()
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

const COLORS = ['#c0392b', '#1a5fa8', '#1a7a4a', '#7c3aed', '#b45309', '#0e7490']

export default function Results({ result }) {
  if (!result) return null

  const {
    sorted, monthly, yearlySnaps, payoffLabel,
    payoffMonths, totalInterest, interestSaved,
    payoffOrder, totalDebt,
  } = result

  // Build chart data — one point per month, one series per debt + total
  const chartData = monthly.map(m => {
    const point = { name: m.label }
    sorted.forEach((d, i) => { point[d.name] = Math.round(m.snap[i]) })
    point['Total'] = Math.round(m.total)
    return point
  })

  const years = Math.floor(payoffMonths / 12)
  const months = payoffMonths % 12
  const timeStr = years > 0
    ? `${plural(years, 'year')}${months > 0 ? ` ${plural(months, 'month')}` : ''}`
    : plural(months, 'month')

  return (
    <div className={styles.wrap}>
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Debt-free date</div>
          <div className={`${styles.metricValue} ${styles.green}`}>{payoffLabel}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Time to freedom</div>
          <div className={`${styles.metricValue} ${styles.green}`}>{timeStr}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Total debt now</div>
          <div className={styles.metricValue}>{fmt(totalDebt)}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricLabel}>Interest you'll pay</div>
          <div className={styles.metricValue}>{fmt(totalInterest)}</div>
        </div>
        {interestSaved > 100 && (
          <div className={`${styles.metric} ${styles.savingsMetric}`}>
            <div className={styles.metricLabel}>Saved vs. minimums only</div>
            <div className={`${styles.metricValue} ${styles.green}`}>{fmt(interestSaved)}</div>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Balance over time</h2>
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                interval={Math.floor(monthly.length / 6)}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={v => '$' + (v >= 1000 ? Math.round(v / 1000) + 'k' : v)}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              <Tooltip
                formatter={(val, name) => [fmt(val), name]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              {sorted.map((d, i) => (
                <Line
                  key={d.name}
                  type="monotone"
                  dataKey={d.name}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={1.5}
                  dot={false}
                />
              ))}
              <Line
                type="monotone"
                dataKey="Total"
                stroke="#374151"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.legend}>
          {sorted.map((d, i) => (
            <span key={d.name} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: COLORS[i % COLORS.length] }} />
              {d.name}
            </span>
          ))}
          <span className={styles.legendItem}>
            <span className={styles.legendDash} />
            Total
          </span>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Payoff order</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Debt</th>
                <th>Balance</th>
                <th>Rate</th>
                <th>Paid off</th>
              </tr>
            </thead>
            <tbody>
              {payoffOrder.map((d, i) => (
                <tr key={d.name}>
                  <td>
                    <span className={styles.priority}>{i + 1}</span>
                    {d.name}
                    {d.apr === 0 && d.promoMonths > 0 && (
                      <span className={`${styles.badge} ${styles.promo}`}>0% promo</span>
                    )}
                    {d.apr > 15 && (
                      <span className={`${styles.badge} ${styles.high}`}>{d.apr}% APR</span>
                    )}
                  </td>
                  <td>{fmt(d.balance)}</td>
                  <td>{d.apr === 0 ? '0%' : `${d.apr}%`}</td>
                  <td className={styles.payoffDate}>{d.payoffLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Year-by-year snapshot</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                {sorted.map(d => <th key={d.name}>{d.name}</th>)}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {yearlySnaps.map(m => (
                <tr key={m.label}>
                  <td><strong>{m.label}</strong></td>
                  {m.snap.map((v, i) => (
                    <td key={i} className={v < 1 ? styles.zeroed : ''}>
                      {v < 1 ? '✓ paid' : fmt(v)}
                    </td>
                  ))}
                  <td><strong>{fmt(m.total)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.footer}>
        <p>
          Payoff order: highest-interest debt first, then shortest 0% promo window, then remaining balances.
          Minimums applied to all accounts; extra budget attacks the priority debt.
        </p>
      </div>
    </div>
  )
}
