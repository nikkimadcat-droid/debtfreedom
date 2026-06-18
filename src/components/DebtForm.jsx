import { useState } from 'react'
import styles from './DebtForm.module.css'

const EMPTY_DEBT = { name: '', balance: '', apr: '', promoMonths: 0 }

export default function DebtForm({ debts, onChange }) {
  function update(i, field, val) {
    const next = debts.map((d, idx) =>
      idx === i ? { ...d, [field]: val } : d
    )
    onChange(next)
  }

  function add() {
    onChange([...debts, { ...EMPTY_DEBT, id: Date.now() }])
  }

  function remove(i) {
    onChange(debts.filter((_, idx) => idx !== i))
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <span>Name</span>
        <span>Balance</span>
        <span>APR %</span>
        <span>Promo months left</span>
        <span />
      </div>

      {debts.map((d, i) => (
        <div key={d.id || i} className={styles.row}>
          <input
            type="text"
            placeholder="e.g. Chase Sapphire"
            value={d.name}
            onChange={e => update(i, 'name', e.target.value)}
          />
          <div className={styles.prefix}>
            <span>$</span>
            <input
              type="number"
              placeholder="0"
              min="0"
              step="1"
              value={d.balance}
              onChange={e => update(i, 'balance', e.target.value)}
            />
          </div>
          <div className={styles.suffix}>
            <input
              type="number"
              placeholder="0"
              min="0"
              max="100"
              step="0.1"
              value={d.apr}
              onChange={e => update(i, 'apr', e.target.value)}
            />
            <span>%</span>
          </div>
          <input
            type="number"
            placeholder="0"
            min="0"
            max="60"
            step="1"
            value={d.promoMonths}
            onChange={e => update(i, 'promoMonths', parseInt(e.target.value) || 0)}
            disabled={parseFloat(d.apr) !== 0}
            title={parseFloat(d.apr) !== 0 ? 'Only applies to 0% APR cards' : ''}
          />
          <button
            className={styles.removeBtn}
            onClick={() => remove(i)}
            aria-label={`Remove ${d.name || 'debt'}`}
            disabled={debts.length === 1}
          >
            ×
          </button>
        </div>
      ))}

      <button className={styles.addBtn} onClick={add}>
        + Add another debt
      </button>

      <p className={styles.hint}>
        Set APR to <strong>0</strong> for promotional 0% cards, then enter how many months remain in the promo period.
      </p>
    </div>
  )
}
