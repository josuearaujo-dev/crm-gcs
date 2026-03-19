import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function requireAuthenticatedUser(redirectTo: string) {
  const user = await getAuthenticatedUser()
  if (!user) {
    const next = encodeURIComponent(redirectTo)
    redirect(`/login?next=${next}`)
  }
  return user
}

export async function getSuperadminFlag() {
  const supabase = await createClient()
  const {
    data: isSuperadmin,
    error,
  } = await supabase.rpc('is_superadmin')
  if (error) return false
  return !!isSuperadmin
}

export async function requireSuperadmin(redirectTo: string) {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(redirectTo)}`)
  }

  const isSuperadmin = await getSuperadminFlag()
  if (!isSuperadmin) {
    redirect(redirectTo)
  }

  return user
}

