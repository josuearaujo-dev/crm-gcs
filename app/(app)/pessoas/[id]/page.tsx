import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapaGC } from '@/components/mapa-gc'
import { DeletePessoaButton } from './delete-pessoa-button'
import { gcMaisProximo, haversineKm } from '@/lib/utils'
import { ChevronLeft, MapPin, Pencil, Navigation } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

export default async function PessoaDetalhePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: pessoa, error }, { data: gcs }] = await Promise.all([
    supabase.from('pessoas').select('*, gc:gcs(*)').eq('id', id).single(),
    supabase.from('gcs').select('*').order('nome'),
  ])

  if (error || !pessoa) notFound()

  const gcAtual = (pessoa as any).gc as any
  const sugestao = gcMaisProximo(pessoa.lat, pessoa.lng, gcs ?? [])

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 px-6 py-4 border-b border-border bg-card flex items-center gap-3">
        <Link href="/pessoas" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center shrink-0">
              {pessoa.nome.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-xl font-semibold text-foreground truncate" style={{ fontFamily: 'var(--font-heading)' }}>
              {pessoa.nome}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 ml-10 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{pessoa.endereco}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link href={`/pessoas/${pessoa.id}/editar`}>
              <Pencil className="w-4 h-4 mr-1.5" />
              Editar
            </Link>
          </Button>
          <DeletePessoaButton id={pessoa.id} nome={pessoa.nome} />
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Info lateral */}
        <aside className="w-72 shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
          {/* GC atual */}
          <div className="px-4 py-4 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              GC atual
            </p>
            {gcAtual ? (
              <Link href={`/gcs/${gcAtual.id}`} className="flex items-start gap-2 group">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {gcAtual.nome}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{gcAtual.endereco}</p>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Não vinculado a nenhum GC</p>
            )}
          </div>

          {/* GC mais próximo */}
          {sugestao && (
            <div className="px-4 py-4 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                GC mais próximo
              </p>
              <Link href={`/gcs/${sugestao.gc.id}`} className="flex items-start gap-2 group">
                <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                    {sugestao.gc.nome}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Navigation className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {sugestao.distanciaKm < 1
                        ? `${(sugestao.distanciaKm * 1000).toFixed(0)} m`
                        : `${sugestao.distanciaKm.toFixed(1)} km`}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Todos os GCs com distância */}
          <div className="px-4 py-4 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Todos os GCs por distância
            </p>
            {!gcs?.length ? (
              <p className="text-sm text-muted-foreground">Nenhum GC cadastrado.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {[...(gcs ?? [])]
                  .map((gc) => {
                    const distKm = haversineKm(pessoa.lat, pessoa.lng, gc.lat, gc.lng)
                    return { gc, distKm }
                  })
                  .sort((a, b) => a.distKm - b.distKm)
                  .map(({ gc, distKm }, i) => {
                    return (
                      <li key={gc.id}>
                        <Link
                          href={`/gcs/${gc.id}`}
                          className="flex items-center justify-between gap-2 text-sm hover:text-primary transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                            <span className="truncate text-foreground">{gc.nome}</span>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {distKm < 1 ? `${(distKm * 1000).toFixed(0)}m` : `${distKm.toFixed(1)}km`}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
              </ul>
            )}
          </div>
        </aside>

        {/* Mapa */}
        <div className="flex-1 min-w-0">
          <MapaGC
            gcs={gcs ?? []}
            pessoas={[pessoa]}
            centerLat={pessoa.lat}
            centerLng={pessoa.lng}
            zoom={13}
            highlightGcId={gcAtual?.id ?? null}
          />
        </div>
      </div>
    </div>
  )
}
