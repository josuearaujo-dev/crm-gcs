import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { MapaGC } from '@/components/mapa-gc'
import { DeleteGCButton } from './delete-gc-button'
import { ChevronLeft, MapPin, Pencil, Users } from 'lucide-react'
import { getAuthenticatedUser } from '@/lib/auth'

type Props = { params: Promise<{ id: string }> }

export default async function GCDetalhePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const user = await getAuthenticatedUser()
  const isAuthenticated = !!user

  const { data: gc, error } = await supabase
    .from('gcs')
    .select('*, pessoas(*)')
    .eq('id', id)
    .single()

  if (error || !gc) notFound()

  const pessoas = gc.pessoas as any[]
  const pessoasToShow = isAuthenticated ? pessoas : []

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 px-6 py-4 border-b border-border bg-card flex items-center gap-3">
        <Link href="/gcs" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
            <h1 className="text-xl font-semibold text-foreground truncate" style={{ fontFamily: 'var(--font-heading)' }}>
              {gc.nome}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{gc.endereco}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/gcs/${gc.id}/editar`}>
                  <Pencil className="w-4 h-4 mr-1.5" />
                  Editar
                </Link>
              </Button>
              <DeleteGCButton id={gc.id} nome={gc.nome} />
            </>
          ) : null}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Membros */}
        <aside className="w-72 shrink-0 border-r border-border bg-card flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Membros</p>
            </div>
            <Badge variant="secondary">{pessoasToShow.length}</Badge>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!isAuthenticated ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Faça login para ver os membros deste GC.
              </div>
            ) : pessoasToShow.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">Nenhum membro neste GC.</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href="/pessoas/nova">Adicionar pessoa</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {pessoasToShow.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/pessoas/${p.id}`}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        {p.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.nome}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.endereco}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Mapa do GC */}
        <div className="flex-1 min-w-0">
          <MapaGC
            gcs={[gc]}
            pessoas={pessoasToShow}
            centerLat={gc.lat}
            centerLng={gc.lng}
            zoom={13}
            highlightGcId={gc.id}
          />
        </div>
      </div>
    </div>
  )
}
