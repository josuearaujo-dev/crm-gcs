import { createClient } from '@/lib/supabase/server'
import { MapaClientWrapper } from './mapa-client-wrapper'

export default async function MapaPage() {
  const supabase = await createClient()

  const [{ data: gcs }, { data: pessoas }] = await Promise.all([
    supabase.from('gcs').select('*').order('nome'),
    supabase.from('pessoas').select('*, gc:gcs(id, nome)').order('nome'),
  ])

  return (
    <div className="flex flex-col min-h-screen">
      <header className="shrink-0 px-6 py-4 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Mapa Geral
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Localize qual GC está mais perto de um endereço.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-[#1e5fa8]" />
            GCs
          </span>
        </div>
      </header>

      <MapaClientWrapper gcs={gcs ?? []} pessoas={pessoas ?? []} />
    </div>
  )
}
