'use client'

import { useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'
import { useGoogleMaps } from '@/hooks/use-google-maps'

type Props = {
  value?: string
  placeholder?: string
  country?: string | string[]
  onSelect: (result: { endereco: string; lat: number; lng: number }) => void
  onClear?: () => void
  disabled?: boolean
  showIcon?: boolean
}

export function AddressSearch({
  value,
  placeholder = 'Buscar endereço...',
  country = 'pt',
  onSelect,
  onClear,
  disabled,
  showIcon = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const elementRef = useRef<HTMLElement | null>(null)
  const { loaded: mapsLoaded } = useGoogleMaps()

  const clearFiredRef = useRef(false)

  function readCurrentPacValue(pac: HTMLElement | null): string {
    if (!pac) return ''

    // Tentativas comuns: propriedade/atributo
    const maybeValue = (pac as any).value ?? pac.getAttribute('value')
    if (typeof maybeValue === 'string') return maybeValue

    // Tentativa de encontrar o <input> interno
    const inputEl = pac.querySelector('input') as HTMLInputElement | null
    if (inputEl && typeof inputEl.value === 'string') return inputEl.value

    // Tentativa em propriedades internas comuns
    const maybeInput = (pac as any).inputElement ?? (pac as any).input
    const maybeInputValue = maybeInput?.value
    if (typeof maybeInputValue === 'string') return maybeInputValue

    return ''
  }

  // Monta o PlaceAutocompleteElement (Web Component) ao carregar a API
  useEffect(() => {
    if (!mapsLoaded || !containerRef.current || elementRef.current) return

    const regionCodes = Array.isArray(country) ? country : [country]

    const google = (window as any).google

    // Cria o elemento de autocomplete da nova Places API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pac = new (google.maps.places as any).PlaceAutocompleteElement({
      includedRegionCodes: regionCodes,
      types: ['address'],
    }) as HTMLElement

    pac.setAttribute('placeholder', placeholder)
    if (value) pac.setAttribute('value', value)
    if (disabled) pac.setAttribute('disabled', '')

    elementRef.current = pac
    containerRef.current.appendChild(pac)

    // Fallback: monitora o valor do campo e chama onClear quando ficar vazio.
    // Importante: começa junto com a criação do pac para não depender de elementRef.current
    // já estar populado em outro useEffect.
    let intervalId: number | undefined
    if (onClear) {
      intervalId = window.setInterval(() => {
        const currentValue = readCurrentPacValue(pac).trim()
        if (!currentValue && !clearFiredRef.current) {
          clearFiredRef.current = true
          onClear()
        }

        if (currentValue) {
          clearFiredRef.current = false
        }
      }, 250)
    }

    // Ouve o evento de seleção de lugar
    pac.addEventListener('gmp-select', async (event: Event) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prediction = (event as any).placePrediction
      if (!prediction) return
      const place = prediction.toPlace()
      await place.fetchFields({ fields: ['formattedAddress', 'location'] })
      const json = place.toJSON()
      const lat = json.location?.lat ?? 0
      const lng = json.location?.lng ?? 0
      const endereco = json.formattedAddress ?? ''
      onSelect({ endereco, lat, lng })
    })

    // Tentativa: alguns builds disparam eventos de input vindos do componente.
    // Mantemos este listener, mas o "fallback" de polling abaixo garante o reset no X.
    pac.addEventListener('input', () => {
      if (!onClear) return
      const currentValue = readCurrentPacValue(pac)
      if (!currentValue) {
        onClear()
      }
    })

    return () => {
      if (intervalId) window.clearInterval(intervalId)
      pac.remove()
      elementRef.current = null
    }
    // onSelect é estável se o consumidor usar useCallback; a dependência de mapsLoaded é suficiente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLoaded, placeholder, disabled, country])

  return (
    <div className="relative">
      {showIcon ? (
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
      ) : null}
      {/* Container onde o Web Component será montado */}
      <div
        ref={containerRef}
        className="address-search-container"
        style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
      />
      {/* Fallback enquanto a API carrega */}
      {!mapsLoaded && (
        <input
          readOnly
          defaultValue={value}
          placeholder={placeholder}
          disabled={disabled}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      )}
    </div>
  )
}
