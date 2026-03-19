'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { GC, Pessoa } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { FridayDatePicker } from '@/components/friday-date-picker'

type PessoaComPresenca = Pessoa & { presente: boolean }

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

export function PresencasPanel({ gcs }: Props) {
  const supabase = React.useMemo(() => createClient(), [])

  const [selectedGcId, setSelectedGcId] = React.useState<string>(gcs[0]?.id ?? '')
  const [selectedDate, setSelectedDate] = React.useState<string>(() => getNextOrSameFriday(new Date()))
  const [year, setYear] = React.useState<number>(() => new Date().getFullYear())

  const [pessoas, setPessoas] = React.useState<PessoaComPresenca[]>([])
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const fridays = React.useMemo(() => getFridaysOfYear(year), [year])

  React.useEffect(() => {
    if (!selectedGcId && gcs[0]?.id) setSelectedGcId(gcs[0].id)
  }, [gcs, selectedGcId])

  const selectedGc = React.useMemo(() => gcs.find((gc) => gc.id === selectedGcId) ?? null, [gcs, selectedGcId])

  const presentes = React.useMemo(() => pessoas.filter((p) => p.presente), [pessoas])
  const presentesCount = presentes.length

  const selectedDateDDMM = React.useMemo(() => {
    if (!selectedDate) return ''
    const parts = selectedDate.split('-')
    if (parts.length !== 3) return selectedDate
    const y = parts[0]
    const m = parts[1]
    const d = parts[2]
    return `${d}/${m}`
  }, [selectedDate])

  const copyText = React.useMemo(() => {
    if (!selectedGc) return ''
    const header = `GC ${selectedGc.nome} - ${selectedDateDDMM} - ${presentesCount} pessoas`
    const list = presentes.map((p) => p.nome).join('\n')
    return `${header}\n\n${list}`.trim()
  }, [selectedGc, selectedDateDDMM, presentes, presentesCount])

  async function onCopiar() {
    try {
      if (!copyText) return
      await navigator.clipboard.writeText(copyText)
      toast.success('Texto copiado!')
    } catch {
      toast.error('Não foi possível copiar automaticamente.')
    }
  }

  React.useEffect(() => {
    // Se a data escolhida não for uma sexta daquele ano, troca para a primeira sexta válida.
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
        .select('pessoa_id, presente')
        .eq('gc_id', selectedGcId)
        .eq('data_reuniao', selectedDate)

      if (presencasError) throw presencasError

      const mapaPresenca = new Map<string, boolean>()
      for (const row of presencasData ?? []) {
        mapaPresenca.set(String(row.pessoa_id), !!row.presente)
      }

      const combined: PessoaComPresenca[] = (pessoasData ?? []).map((p: any) => ({
        ...p,
        presente: mapaPresenca.get(String(p.id)) ?? false,
      }))

      setPessoas(combined)
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao carregar presenças.')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (!selectedGcId || !selectedDate) return
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGcId, selectedDate])

  async function onSalvar() {
    if (!selectedGcId || !selectedDate) return
    setSaving(true)
    try {
      const presentesIds = pessoas.filter((p) => p.presente).map((p) => p.id)

      const { error } = await supabase.rpc('gc_marcar_presencas', {
        p_gc_id: selectedGcId,
        p_data_reuniao: selectedDate,
        p_presentes: presentesIds,
        p_ausentes_tambem: true,
      })

      if (error) throw error
      toast.success('Presenças marcadas com sucesso!')
      await carregar()
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao salvar presenças.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 px-6 py-4 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Presenças
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Marque a presença do seu GC nas sextas-feiras.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <Card className="bg-card">
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gc_id_presencas">GC</Label>
                <select
                  id="gc_id_presencas"
                  value={selectedGcId}
                  onChange={(e) => setSelectedGcId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={loading || saving}
                >
                  {gcs.map((gc) => (
                    <option key={gc.id} value={gc.id}>
                      {gc.nome}
                    </option>
                  ))}
                </select>
                {!gcs.length && (
                  <p className="text-xs text-muted-foreground">Você não é líder de nenhum GC.</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="year_presencas">Ano</Label>
                <select
                  id="year_presencas"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled={loading || saving}
                >
                  {(() => {
                    const current = new Date().getFullYear()
                    const years = [current - 1, current, current + 1]
                    // dedupe (em caso de coincidência)
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
              <Label htmlFor="date_presencas">Sexta-feira</Label>
              <div className="w-full overflow-x-auto">
                <FridayDatePicker
                  year={year}
                  value={selectedDate}
                  onChange={(v) => setSelectedDate(v)}
                  disabled={loading || saving}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="text-sm text-muted-foreground">
                {pessoas.filter((p) => p.presente).length} presentes de {pessoas.length}
              </div>
              <Button type="button" onClick={onSalvar} disabled={!pessoas.length || saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar presenças
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">Carregando...</div>
        ) : (
          <>
            <Card className="bg-card">
              <CardContent className="p-0">
                {!gcs.length ? (
                  <div className="p-6 text-sm text-muted-foreground">Sem acesso. Peça para ser líder de um GC.</div>
                ) : pessoas.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">Este GC não tem pessoas cadastradas.</div>
                ) : (
                  <ul className="divide-y divide-border">
                    {pessoas.map((p) => (
                      <li key={p.id} className="px-4 py-3 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={p.presente}
                              onCheckedChange={(v) =>
                                setPessoas((prev) =>
                                  prev.map((x) => (x.id === p.id ? { ...x, presente: v === true } : x))
                                )
                              }
                              disabled={saving}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{p.nome}</p>
                              <p className="text-xs text-muted-foreground truncate">{p.endereco}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">{p.presente ? 'Presente' : 'Ausente'}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {gcs.length && pessoas.length ? (
              <Card className="bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Resumo para compartilhar</p>
                      <p className="text-xs text-muted-foreground">O texto será atualizado conforme você marcar presença.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={onCopiar} disabled={!copyText}>
                      Copiar
                    </Button>
                  </div>

                  <Textarea value={copyText} readOnly rows={5} className="resize-none" />
                </CardContent>
              </Card>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

