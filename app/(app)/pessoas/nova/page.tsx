import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PessoaForm } from '@/components/pessoa-form'
import { ChevronLeft } from 'lucide-react'
import { requireAuthenticatedUser } from '@/lib/auth'

export default async function NovaPessoaPage() {
  await requireAuthenticatedUser('/pessoas/nova')
  const supabase = await createClient()

  const { data: isSuperadmin } = await supabase.rpc('is_superadmin')

  // Se for superadmin, pode cadastrar pessoas em qualquer GC.
  if (isSuperadmin) {
    const { data: gcsAll } = await supabase.from('gcs').select('*').order('nome')
    return (
      <div className="flex flex-col h-full">
        <header className="shrink-0 px-6 py-4 border-b border-border bg-card flex items-center gap-3">
          <Link href="/pessoas" className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Nova Pessoa
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Selecione o GC e cadastre uma nova pessoa.
            </p>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <PessoaForm gcs={gcsAll ?? []} />
        </div>
      </div>
    )
  }

  // GC(s) onde o usuário atual é líder
  const { data: leaderRows, error: leadersError } = await supabase
    .from('gc_leaders')
    .select('gc_id')

  if (leadersError) throw new Error(leadersError.message)

  const gcIds = (leaderRows ?? []).map((r: any) => r.gc_id).filter(Boolean)
  const { data: gcs } = await supabase
    .from('gcs')
    .select('*')
    .in('id', gcIds.length ? gcIds : ['00000000-0000-0000-0000-000000000000'])
    .order('nome')

  if (!gcs?.length) {
    return (
      <div className="flex flex-col h-full">
        <header className="shrink-0 px-6 py-4 border-b border-border bg-card flex items-center gap-3">
          <Link href="/pessoas" className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Nova Pessoa
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Faça login como líder para adicionar pessoas.
            </p>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-muted-foreground">Você não é líder de nenhum GC.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 px-6 py-4 border-b border-border bg-card flex items-center gap-3">
        <Link href="/pessoas" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Nova Pessoa
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ao informar o endereço, o GC mais próximo será sugerido automaticamente
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <PessoaForm
          gcs={gcs ?? []}
          hideGcSelector
          fixedGcId={gcs?.[0]?.id}
        />
      </div>
    </div>
  )
}
