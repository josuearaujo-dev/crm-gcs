import { GCForm } from '@/components/gc-form'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { requireSuperadmin } from '@/lib/auth'

export default async function NovoGCPage() {
  await requireSuperadmin('/gcs/novo')
  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 px-6 py-4 border-b border-border bg-card flex items-center gap-3">
        <Link href="/gcs" className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Novo Grupo de Célula
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Preencha as informações do novo GC
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <GCForm />
      </div>
    </div>
  )
}
