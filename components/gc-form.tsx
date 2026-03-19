'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { criarGC, atualizarGC } from '@/lib/actions'
import { AddressSearch } from './address-search'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import type { GC } from '@/lib/types'

type Props = {
  gc?: GC
}

export function GCForm({ gc }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [coords, setCoords] = useState<{ endereco: string; lat: number; lng: number } | null>(
    gc ? { endereco: gc.endereco, lat: gc.lat, lng: gc.lng } : null
  )
  const formRef = useRef<HTMLFormElement>(null)

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

    startTransition(async () => {
      try {
        if (gc) {
          await atualizarGC(gc.id, data)
          toast.success('GC atualizado com sucesso!')
        } else {
          await criarGC(data)
          toast.success('GC cadastrado com sucesso!')
        }
        router.push('/gcs')
        router.refresh()
      } catch (err: any) {
        toast.error(err.message ?? 'Erro ao salvar GC.')
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-lg">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nome">Nome do GC</Label>
        <Input
          id="nome"
          name="nome"
          defaultValue={gc?.nome}
          placeholder="Ex: GC da Vila Mariana"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Endereço / Local da reunião</Label>
        <AddressSearch
          value={coords?.endereco}
          placeholder="Buscar endereço..."
          onSelect={(result) => setCoords(result)}
        />
        {coords && (
          <p className="text-xs text-muted-foreground mt-1">
            Coordenadas: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {gc ? 'Salvar alterações' : 'Cadastrar GC'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
