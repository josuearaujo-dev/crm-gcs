import { createClient } from '@/lib/supabase/server'
import { requireAuthenticatedUser } from '@/lib/auth'
import type { GC } from '@/lib/types'
import { PresencasHistoricoPanel } from '@/components/presencas-historico-panel'

export default async function PresencasHistoricoPage() {
  await requireAuthenticatedUser('/presencas/historico')

  const supabase = await createClient()

  const { data: leaderRows, error: leadersError } = await supabase
    .from('gc_leaders')
    .select('gc_id')

  if (leadersError) throw new Error(leadersError.message)

  const gcIds = (leaderRows ?? []).map((r: any) => r.gc_id).filter(Boolean)

  const { data: gcs, error: gcsError } = await supabase
    .from('gcs')
    .select('*')
    .in('id', gcIds.length ? gcIds : ['00000000-0000-0000-0000-000000000000'])

  if (gcsError) throw new Error(gcsError.message)

  return <PresencasHistoricoPanel gcs={(gcs ?? []) as GC[]} />
}

