'use client'

import * as React from 'react'
import { MapaGC } from '@/components/mapa-gc'
import type { GC, Pessoa } from '@/lib/types'
import { GCDistancePanel, ReferenceCoords } from '@/components/gc-distance-panel'

type Props = {
  gcs: GC[]
  pessoas: Pessoa[]
}

export function MapaClientWrapper({ gcs, pessoas }: Props) {
  const [reference, setReference] = React.useState<ReferenceCoords | null>(null)
  const [highlightGcId, setHighlightGcId] = React.useState<string | null>(null)

  return (
    <div className="flex flex-col md:flex-row flex-1 w-full">
      {/* Mapa */}
      <div className="flex-1 min-w-0 min-h-[50vh] md:min-h-0">
        <MapaGC
          gcs={gcs}
          pessoas={pessoas}
          highlightGcId={highlightGcId}
          referencePoint={
            reference ? { lat: reference.lat, lng: reference.lng } : null
          }
          showLinesFromReference={!!reference && !!highlightGcId}
        />
      </div>

      {/* Painel lateral: distância até os GCs */}
      <aside className="w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-border bg-card">
        <GCDistancePanel
          gcs={gcs}
          pessoas={pessoas}
          reference={reference}
          onReferenceChange={(coords) => {
            setReference(coords)
            // Sempre que mudar o endereço, limpa GC destacado;
            // o usuário pode clicar em um GC na lista para destacar.
            setHighlightGcId(null)
          }}
          onSelectGc={(gcId) => setHighlightGcId(gcId)}
        />
      </aside>
    </div>
  )
}
