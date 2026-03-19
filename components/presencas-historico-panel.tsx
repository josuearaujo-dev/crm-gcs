'use client'

import * as React from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GC, Pessoa } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { FridayDatePicker } from '@/components/friday-date-picker'

type PessoaComPresenca = Pessoa & {
  presente: boolean
  observacao?: string | null
}

type Props = {
  gcs: GC[]
}

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

function getFridaysOfYear(year: number) {
  const res: string[] = []
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)
  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    if (isoDow(dt) === 5) res.push(formatDateInputValue(dt))
  }
  return res
}

function getNextOrSameFriday(fromDate: Date) {
  const d = new Date(fromDate)
  d.setHours(0, 0, 0, 0)
  while (true) {
    if (isoDow(d) === 5) return formatDateInputValue(d)
    d.setDate(d.getDate() + 1)
  }
}

export function PresencasHistoricoPanel({ gcs }: Props) {
  const supabase = React.useMemo(() => createClient(), [])

  const [selectedGcId, setSelectedGcId] = React.useState<string>(gcs[0]?.id ?? '')
  const [year, setYear] = React.useState<number>(() => new Date().getFullYear())
  const fridays = React.useMemo(() => getFridaysOfYear(year), [year])
  const [selectedDate, setSelectedDate] = React.useState<string>(() =>
    getNextOrSameFriday(new Date()),
  )

  const [pessoas, setPessoas] = React.useState<PessoaComPresenca[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!selectedGcId && gcs[0]?.id) setSelectedGcId(gcs[0].id)
  }, [gcs, selectedGcId])

  React.useEffect(() => {
    if (year && fridays.length && !fridays.includes(selectedDate)) {
      setSelectedDate(fridays[0])
    }
  }, [year, fridays, selectedDate])

  async function carregar() {
    if (!selectedGcId || !selectedDate) return
    setLoading(true)
    try {
      const { data: pessoasData, error: pessoasError } = await supabase
        .from('pessoas')
        .select('*')
        .eq('gc_id', selectedGcId)
        .order('nome')

      if (pessoasError) throw pessoasError

      const { data: presencasData, error: presencasError } = await supabase
        .from('gc_presencas')
        .select('pessoa_id, presente, observacao')
        .eq('gc_id', selectedGcId)
        .eq('data_reuniao', selectedDate)

      if (presencasError) throw presencasError

      const mapaPresenca = new Map<string, { presente: boolean; observacao: string | null }>()
      for (const row of presencasData ?? []) {
        mapaPresenca.set(String(row.pessoa_id), {
          presente: !!row.presente,
          observacao: row.observacao ?? null,
        })
      }

      const combined: PessoaComPresenca[] = (pessoasData ?? []).map((p: any) => {
        const pr = mapaPresenca.get(String(p.id))
        return {
          ...p,
          presente: pr?.presente ?? false,
          observacao: pr?.observacao ?? null,
        }
      })

      setPessoas(combined)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (!selectedGcId || !selectedDate) return
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGcId, selectedDate])

  const total = pessoas.length
  const presentes = pessoas.filter((p) => p.presente).length

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 px-6 py-4 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Histórico de Presenças
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visualize as presenças por sexta-feira do seu GC.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
          <Link href="/presencas">Marcar presenças</Link>
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <Card className="bg-card">
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gc_id_historico">GC</Label>
                <select
                  id="gc_id_historico"
                  value={selectedGcId}
                  onChange={(e) => setSelectedGcId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={loading}
                >
                  {gcs.map((gc) => (
                    <option key={gc.id} value={gc.id}>
                      {gc.nome}
                    </option>
                  ))}
                </select>
                {!gcs.length ? (
                  <p className="text-xs text-muted-foreground">Você não é líder de nenhum GC.</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="year_historico">Ano</Label>
                <select
                  id="year_historico"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={loading}
                >
                  {(() => {
                    const current = new Date().getFullYear()
                    const years = [current - 1, current, current + 1]
                    return Array.from(new Set(years)).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))
                  })()}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date_historico">Sexta-feira</Label>
              <div className="w-full overflow-x-auto">
                <FridayDatePicker
                  year={year}
                  value={selectedDate}
                  onChange={(v) => setSelectedDate(v)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="text-sm text-muted-foreground">
                {presentes} presentes de {total}
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Carregando histórico...
          </div>
        ) : pessoas.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            Não há pessoas cadastradas para este GC.
          </div>
        ) : (
          <Card className="bg-card">
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {pessoas.map((p) => (
                  <li key={p.id} className="px-4 py-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={p.presente} disabled />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.nome}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.endereco}</p>
                          {p.observacao ? (
                            <p className="text-[11px] text-muted-foreground mt-1 truncate">{p.observacao}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">{p.presente ? 'Presente' : 'Ausente'}</div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

