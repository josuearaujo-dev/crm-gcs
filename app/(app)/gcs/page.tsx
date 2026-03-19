import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, MapPin, Users, ChevronRight } from 'lucide-react'

export default async function GCsPage() {
  const supabase = await createClient()
  const { data: isSuperadmin } = await supabase.rpc('is_superadmin')
  const { data: gcs } = await supabase
    .from('gcs')
    .select('*, pessoas(id)')
    .order('nome')

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 px-6 py-4 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Grupos de Célula
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {gcs?.length ?? 0} grupos cadastrados
          </p>
        </div>
        {isSuperadmin ? (
          <Button asChild>
            <Link href="/gcs/novo">
              <PlusCircle className="w-4 h-4 mr-2" />
              Novo GC
            </Link>
          </Button>
        ) : null}
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {!gcs?.length ? (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Nenhum GC cadastrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Cadastre seu primeiro grupo de célula para começar.
              </p>
            </div>
            {isSuperadmin ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/gcs/novo">Cadastrar GC</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href="/mapa">Voltar ao mapa</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {gcs.map((gc) => {
              const totalMembros = (gc.pessoas as { id: string }[])?.length ?? 0
              return (
                <Link key={gc.id} href={`/gcs/${gc.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1" />
                          <h2 className="font-semibold text-foreground leading-tight">{gc.nome}</h2>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="leading-relaxed line-clamp-2">{gc.endereco}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {totalMembros} {totalMembros === 1 ? 'membro' : 'membros'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
