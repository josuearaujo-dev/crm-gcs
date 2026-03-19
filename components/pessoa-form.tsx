'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { criarPessoa, atualizarPessoa } from '@/lib/actions'
import { gcMaisProximo } from '@/lib/utils'
import { AddressSearch } from './address-search'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, MapPin, Navigation } from 'lucide-react'
import type { GC, Pessoa } from '@/lib/types'

type Props = {
  pessoa?: Pessoa
  gcs: GC[]
  redirectTo?: string
  hideGcSelector?: boolean
  fixedGcId?: string
}

export function PessoaForm({
  pessoa,
  gcs,
  redirectTo = '/pessoas',
  hideGcSelector = false,
  fixedGcId,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [coords, setCoords] = useState<{ endereco: string; lat: number; lng: number } | null>(
    pessoa ? { endereco: pessoa.endereco, lat: pessoa.lat, lng: pessoa.lng } : null
  )
  const [gcIdSelecionado, setGcIdSelecionado] = useState<string>(
    fixedGcId ?? pessoa?.gc_id ?? ''
  )
  const [sugestaoGC, setSugestaoGC] = useState<{ gc: GC; distanciaKm: number } | null>(null)

  useEffect(() => {
    if (fixedGcId) setGcIdSelecionado(fixedGcId)
  }, [fixedGcId])

  function handleEnderecoSelect(result: { endereco: string; lat: number; lng: number }) {
    setCoords(result)

    // Se o GC estiver fixo (ex: líder só pode cadastrar no próprio GC), não alteramos o vínculo.
    if (hideGcSelector && fixedGcId) {
      setGcIdSelecionado(fixedGcId)
      setSugestaoGC(null)
      return
    }

    // Calcula o GC mais próximo automaticamente
    const sugestao = gcMaisProximo(result.lat, result.lng, gcs)
    setSugestaoGC(sugestao)
    if (sugestao) setGcIdSelecionado(sugestao.gc.id)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!coords) {
      toast.error('Selecione um endereço válido no campo de busca.')
      return
    }
    const data = new FormData(e.currentTarget)
    data.set('endereco', coords.endereco)
    data.set('lat', String(coords.lat))
    data.set('lng', String(coords.lng))
    data.set('gc_id', gcIdSelecionado)

    startTransition(async () => {
      try {
        if (pessoa) {
          await atualizarPessoa(pessoa.id, data)
          toast.success('Pessoa atualizada com sucesso!')
        } else {
          await criarPessoa(data)
          toast.success('Pessoa cadastrada com sucesso!')
        }
        router.push(redirectTo)
        router.refresh()
      } catch (err: any) {
        toast.error(err.message ?? 'Erro ao salvar.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-lg">
      {/* Nome */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nome">Nome completo</Label>
        <Input
          id="nome"
          name="nome"
          defaultValue={pessoa?.nome}
          placeholder="Ex: João Silva"
          required
        />
      </div>

      {/* Endereço com busca */}
      <div className="flex flex-col gap-1.5">
        <Label>Endereço onde mora</Label>
        <AddressSearch
          value={coords?.endereco}
          placeholder="Buscar endereço..."
          onSelect={handleEnderecoSelect}
        />
        {coords && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        )}
      </div>

      {/* Sugestão automática de GC (apenas quando há seleção) */}
      {!hideGcSelector && sugestaoGC && (
        <div className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              GC mais próximo sugerido
            </p>
            <p className="text-sm text-foreground mt-0.5">
              <span className="font-semibold">{sugestaoGC.gc.nome}</span>
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Navigation className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {sugestaoGC.distanciaKm < 1
                  ? `${(sugestaoGC.distanciaKm * 1000).toFixed(0)} m de distância`
                  : `${sugestaoGC.distanciaKm.toFixed(1)} km de distância`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Seleção de GC */}
      {!hideGcSelector && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gc_id">Vincular ao GC</Label>
          <select
            id="gc_id"
            name="gc_id"
            value={gcIdSelecionado}
            onChange={(e) => setGcIdSelecionado(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Sem vínculo</option>
            {gcs.map((gc) => (
              <option key={gc.id} value={gc.id}>
                {gc.nome}
                {sugestaoGC?.gc.id === gc.id ? ' (mais próximo)' : ''}
              </option>
            ))}
          </select>
          {!gcs.length && (
            <p className="text-xs text-muted-foreground">Nenhum GC cadastrado ainda.</p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {pessoa ? 'Salvar alterações' : 'Cadastrar pessoa'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
