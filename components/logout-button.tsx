'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

type Props = {
  compact?: boolean
  className?: string
}

export function LogoutButton({ compact, className }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = React.useState(false)

  async function onLogout() {
    setIsPending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      toast.success('Logout realizado.')
      router.push('/login')
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao sair.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={isPending}
      onClick={onLogout}
      className={`justify-start ${className ?? ''}`.trim()}
    >
      <LogOut className="w-4 h-4 mr-2 shrink-0" />
      {!compact ? 'Sair' : null}
    </Button>
  )
}

