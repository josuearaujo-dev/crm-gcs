'use client'

import { useEffect, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

let loaderInstance: Loader | null = null
let loadPromise: Promise<void> | null = null

function getLoader() {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
      version: 'weekly',
    })
  }
  return loaderInstance
}

export function useGoogleMaps() {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (window.google?.maps?.places) {
      setLoaded(true)
      return
    }

    if (!loadPromise) {
      const loader = getLoader()
      // importLibrary usa loading=async internamente, evitando o aviso de performance
      loadPromise = Promise.all([
        loader.importLibrary('maps'),
        loader.importLibrary('places'),
      ]).then(() => undefined)
    }

    loadPromise
      .then(() => setLoaded(true))
      .catch((err: Error) => setError(err))
  }, [])

  return { loaded, error }
}
