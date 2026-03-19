'use client'

import * as React from 'react'
import type { GC, Pessoa } from '@/lib/types'
import { AddressSearch } from '@/components/address-search'

export type ReferenceCoords = {
  endereco: string
  lat: number
  lng: number
}

type Props = {
  gcs: GC[]
  pessoas: Pessoa[]
  reference: ReferenceCoords | null
  onReferenceChange: (coords: ReferenceCoords | null) => void
  onSelectGc?: (gcId: string) => void
}

type GCWithDistance = GC & {
  distanceKm: number
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // raio da Terra em km
  const toRad = (v: number) => (v * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export function GCDistancePanel({ gcs, pessoas, reference, onReferenceChange, onSelectGc }: Props) {
  const gcsWithDistance: GCWithDistance[] = React.useMemo(() => {
    if (!reference) return []
    return gcs
      .map((gc) => {
        const distanceKm = haversineDistanceKm(reference.lat, reference.lng, gc.lat, gc.lng)
        return { ...gc, distanceKm }
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }, [gcs, pessoas, reference])

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border space-y-2">
        <div>
          <p className="text-sm font-medium text-foreground">Distância até os GCs</p>
          <p className="text-xs text-muted-foreground">
            Escolha um endereço para ver qual GC fica mais perto.
          </p>
        </div>
        <AddressSearch
          value={reference?.endereco}
          placeholder="Digite um endereço de referência..."
          onSelect={(result) => onReferenceChange(result)}
          onClear={() => onReferenceChange(null)}
          showIcon={false}
        />
        {reference && (
          <p className="text-[11px] text-muted-foreground leading-snug">
            Endereço selecionado:
            <br />
            <span className="font-medium text-foreground">{reference.endereco}</span>
          </p>
        )}
      </div>

      {!reference ? (
        <div className="px-4 py-6 text-xs text-muted-foreground">
          Digite um endereço acima para calcular as distâncias dos GCs.
        </div>
      ) : !gcsWithDistance.length ? (
        <div className="px-4 py-6 text-xs text-muted-foreground">
          Nenhum GC cadastrado para calcular a distância.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <ul className="divide-y divide-border text-sm">
            {gcsWithDistance.map((gc) => (
              <li
                key={gc.id}
                className="px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onSelectGc?.(gc.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-foreground truncate">{gc.nome}</p>
                  <span className="text-xs font-semibold text-primary whitespace-nowrap">
                    {gc.distanceKm < 1
                      ? `${Math.round(gc.distanceKm * 1000)} m`
                      : `${gc.distanceKm.toFixed(1)} km`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{gc.endereco}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

