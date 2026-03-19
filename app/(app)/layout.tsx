import { AppSidebar } from '@/components/app-sidebar'
import { createClient } from '@/lib/supabase/server'
import { getSuperadminFlag } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isSuperadmin = await getSuperadminFlag()

  return (
    <div className="flex min-h-dvh bg-background">
      <AppSidebar isAuthenticated={!!user} isSuperadmin={isSuperadmin} />
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden overflow-y-auto pb-16 md:pb-0 md:overflow-hidden">
        {children}
      </main>
    </div>
  )
}
