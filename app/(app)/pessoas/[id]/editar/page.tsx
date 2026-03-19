import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PessoaForm } from '@/components/pessoa-form'
import { ChevronLeft } from 'lucide-react'
import { requireAuthenticatedUser } from '@/lib/auth'

type Props = { params: Promise<{ id: string }> }

export default async function EditarPessoaPage({ params }: Props) {
  const { id } = await params
  await requireAuthenticatedUser(`/pessoas/${id}/editar`)
  const supabase = await createClient()

  const [{ data: pessoa, error }, { data: gcs }] = await Promise.all([
    supabase.from('pessoas').select('*').eq('id', id).single(),
    supabase.from('gcs').select('*').order('nome'),
  ])

  if (error || !pessoa) notFound()

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 px-6 py-4 border-b border-border bg-card flex items-center gap-3">
        <Link href={`/pessoas/${id}`} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Editar Pessoa
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pessoa.nome}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <PessoaForm pessoa={pessoa} gcs={gcs ?? []} redirectTo={`/pessoas/${id}`} />
      </div>
    </div>
  )
}
