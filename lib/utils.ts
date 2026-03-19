import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { GC } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Calcula distância em km entre dois pontos usando a fórmula de Haversine
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Retorna o GC mais próximo de uma coordenada
export function gcMaisProximo(
  lat: number,
  lng: number,
  gcs: GC[]
): { gc: GC; distanciaKm: number } | null {
  if (!gcs.length) return null
  let melhor = gcs[0]
  let menorDist = haversineKm(lat, lng, gcs[0].lat, gcs[0].lng)
  for (const gc of gcs.slice(1)) {
    const dist = haversineKm(lat, lng, gc.lat, gc.lng)
    if (dist < menorDist) {
      menorDist = dist
      melhor = gc
    }
  }
  return { gc: melhor, distanciaKm: menorDist }
}

