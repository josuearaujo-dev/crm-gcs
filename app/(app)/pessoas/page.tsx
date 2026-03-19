import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, MapPin, Users } from 'lucide-react'

export default async function PessoasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isAuthenticated = !!user
  const { data: pessoas } = await supabase
    .from('pessoas')
    .select('*, gc:gcs(id, nome)')
    .order('nome')

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 px-6 py-4 border-b border-border bg-card flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Pessoas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pessoas?.length ?? 0} pessoas cadastradas
          </p>
        </div>
        {isAuthenticated ? (
          <Button asChild>
            <Link href="/pessoas/nova">
              <UserPlus className="w-4 h-4 mr-2" />
              Nova Pessoa
            </Link>
          </Button>
        ) : null}
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {!pessoas?.length ? (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Nenhuma pessoa cadastrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Cadastre a primeira pessoa para começar.
              </p>
            </div>
            {isAuthenticated ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/pessoas/nova">Cadastrar pessoa</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Entrar para cadastrar</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Endereço</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">GC</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pessoas.map((pessoa) => (
                  <tr key={pessoa.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                          {pessoa.nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{pessoa.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground max-w-xs">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{pessoa.endereco}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {(pessoa as any).gc ? (
                        <Badge variant="secondary" className="text-primary border-primary/20 bg-primary/10">
                          {(pessoa as any).gc.nome}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sem GC</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/pessoas/${pessoa.id}`}>Ver</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
