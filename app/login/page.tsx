import * as React from 'react'
import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth'
import { LoginForm } from '@/components/login-form'

type Props = {
  searchParams?: { next?: string }
}

export default async function LoginPage({ searchParams }: Props) {
  const user = await getAuthenticatedUser()
  const next = decodeURIComponent(searchParams?.next || '/mapa')

  if (user) {
    redirect(next)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <LoginForm next={next} />
    </div>
  )
}

