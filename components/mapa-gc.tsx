'use client'

import { useEffect, useRef } from 'react'
import type { GC, Pessoa } from '@/lib/types'
import { useGoogleMaps } from '@/hooks/use-google-maps'

type Props = {
  gcs: GC[]
  pessoas: Pessoa[]
  centerLat?: number
  centerLng?: number
  zoom?: number
  highlightGcId?: string | null
  referencePoint?: { lat: number; lng: number } | null
  showLinesFromReference?: boolean
  onGcClick?: (gc: GC) => void
  onPessoaClick?: (pessoa: Pessoa) => void
}

export function MapaGC({
  gcs,
  pessoas,
  centerLat = 41.548816,
  centerLng = -8.415433,
  zoom = 11,
  highlightGcId = null,
  referencePoint = null,
  showLinesFromReference = false,
  onGcClick,
  onPessoaClick,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const polylinesRef = useRef<google.maps.Polyline[]>([])
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)
  const routeRunIdRef = useRef(0)
  const { loaded } = useGoogleMaps()

  // Inicializa o mapa
  useEffect(() => {
    if (!loaded || !mapRef.current) return
    if (mapInstanceRef.current) return
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: centerLat, lng: centerLng },
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    })
  }, [loaded, centerLat, centerLng, zoom])

  // Renderiza marcadores sempre que dados mudam
  useEffect(() => {
    if (!loaded || !mapInstanceRef.current) return

    // Invalida callbacks pendentes de routes anteriores (ex: usuário clicou no X)
    routeRunIdRef.current += 1
    const currentRouteRunId = routeRunIdRef.current

    // Remove marcadores antigos
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
    polylinesRef.current.forEach((p) => p.setMap(null))
    polylinesRef.current = []

    const infoWindow = new window.google.maps.InfoWindow()

    // Marcador do endereço de referência (se houver)
    if (referencePoint) {
      const refMarker = new window.google.maps.Marker({
        position: referencePoint,
        map: mapInstanceRef.current,
        title: 'Endereço de referência',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#16a34a',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        zIndex: 25,
      })
      markersRef.current.push(refMarker)
    }

    // Marcadores de GCs
    for (const gc of gcs) {
      const isHighlighted = gc.id === highlightGcId
      const marker = new window.google.maps.Marker({
        position: { lat: gc.lat, lng: gc.lng },
        map: mapInstanceRef.current,
        title: gc.nome,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isHighlighted ? 14 : 10,
          fillColor: isHighlighted ? '#16a34a' : '#1e5fa8',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        label: {
          text: 'GC',
          color: '#fff',
          fontSize: '9px',
          fontWeight: 'bold',
        },
        zIndex: isHighlighted ? 20 : 10,
      })

      marker.addListener('click', () => {
        infoWindow.setContent(
          `<div style="font-family:sans-serif;padding:4px 2px">
            <strong style="font-size:14px">${gc.nome}</strong>
            <p style="font-size:12px;color:#555;margin:4px 0 0">${gc.endereco}</p>
          </div>`
        )
        infoWindow.open(mapInstanceRef.current, marker)
        onGcClick?.(gc)
      })

      markersRef.current.push(marker)
    }

    // Marcadores de Pessoas
    for (const pessoa of pessoas) {
      const marker = new window.google.maps.Marker({
        position: { lat: pessoa.lat, lng: pessoa.lng },
        map: mapInstanceRef.current,
        title: pessoa.nome,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: '#f59e0b',
          fillOpacity: 0.9,
          strokeColor: '#fff',
          strokeWeight: 1.5,
        },
        zIndex: 5,
      })

      marker.addListener('click', () => {
        infoWindow.setContent(
          `<div style="font-family:sans-serif;padding:4px 2px">
            <strong style="font-size:14px">${pessoa.nome}</strong>
            <p style="font-size:12px;color:#555;margin:4px 0 0">${pessoa.endereco}</p>
            ${pessoa.gc ? `<p style="font-size:12px;color:#1e5fa8;margin:2px 0 0">GC: ${(pessoa as any).gc?.nome ?? ''}</p>` : ''}
          </div>`
        )
        infoWindow.open(mapInstanceRef.current, marker)
        onPessoaClick?.(pessoa)
      })

      markersRef.current.push(marker)
    }

    // Caminho (rota) do endereço de referência até o GC selecionado
    if (referencePoint && showLinesFromReference && highlightGcId) {
      if (!directionsServiceRef.current) {
        directionsServiceRef.current = new window.google.maps.DirectionsService()
      }

      const gc = gcs.find((item) => item.id === highlightGcId)
      if (gc) {
        const origin = referencePoint
        const destination = { lat: gc.lat, lng: gc.lng }
        const gcIdAtRequest = highlightGcId

        directionsServiceRef.current.route(
          {
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            // Se o usuário limpou / mudou o destino enquanto a rota carregava, não desenha.
            if (
              routeRunIdRef.current !== currentRouteRunId ||
              !referencePoint ||
              !showLinesFromReference ||
              highlightGcId !== gcIdAtRequest
            ) {
              return
            }

            if (status === 'OK' && result && result.routes[0]) {
              const polyline = new window.google.maps.Polyline({
                path: result.routes[0].overview_path,
                strokeColor: '#16a34a',
                strokeOpacity: 0.6,
                strokeWeight: 3,
                map: mapInstanceRef.current,
              })
              polylinesRef.current.push(polyline)
            }
          }
        )
      }
    }
  }, [loaded, gcs, pessoas, highlightGcId, referencePoint, showLinesFromReference, onGcClick, onPessoaClick])

  return (
    <div className="w-full h-full relative">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <div className="text-muted-foreground text-sm">Carregando mapa...</div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}
