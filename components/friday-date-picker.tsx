'use client'

import * as React from 'react'
import { DayPicker } from 'react-day-picker'

import 'react-day-picker/dist/style.css'

function isoDow(d: Date) {
  // ISO dow: Monday=1..Sunday=7
  return ((d.getDay() + 6) % 7) + 1
}

function formatDateInputValue(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDateInputValue(v: string) {
  // v = YYYY-MM-DD
  const [y, m, d] = v.split('-').map((x) => Number(x))
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

type Props = {
  year: number
  value: string | null
  onChange: (value: string) => void
  disabled?: boolean
}

export function FridayDatePicker({ year, value, onChange, disabled }: Props) {
  const selected = value ? parseDateInputValue(value) ?? undefined : undefined

  const disabledDays = React.useCallback(
    (date: Date) => {
      // Bloqueia fora do ano e todos os dias que não sejam sexta
      if (date.getFullYear() !== year) return true
      return isoDow(date) !== 5
    },
    [year]
  )

  return (
    <div>
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={(d) => {
          if (!d) return
          onChange(formatDateInputValue(d))
        }}
        disabled={
          disabled
            ? () => true
            : (date: Date) => disabledDays(date)
        }
        fromMonth={new Date(year, 0, 1)}
        toMonth={new Date(year, 11, 31)}
        captionLayout="dropdown"
        // Pequeno ajuste pra ficar mais "compacto" no mobile
        className="rdp-friday"
      />
    </div>
  )
}

