import { createClient } from '@/lib/supabase/server'
import { requireAuthenticatedUser } from '@/lib/auth'
import type { GC } from '@/lib/types'
import { PresencasPanel } from '@/components/presencas-panel'

export default async function PresencasPage() {
  await requireAuthenticatedUser('/presencas')

  const supabase = await createClient()

  // Puxamos os GC's onde o usuário é líder (RLS em gc_leaders limita automaticamente).
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

  return <PresencasPanel gcs={(gcs ?? []) as GC[]} />
}

