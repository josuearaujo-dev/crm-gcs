'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Loader2, LogIn } from 'lucide-react'

type Props = {
  next?: string
}

export function LoginForm({ next = '/mapa' }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Informe seu e-mail.')
      return
    }
    if (!password) {
      toast.error('Informe sua senha.')
      return
    }

    setIsPending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) throw error

      toast.success('Login realizado com sucesso!')
      router.push(next)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao fazer login.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <LogIn className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Entrar</h1>
            <p className="text-sm text-muted-foreground">Acesse para cadastrar e editar.</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            autoComplete="current-password"
            required
          />
        </div>

        <Button type="submit" disabled={isPending} className="mt-1">
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Entrar
        </Button>
      </form>
    </div>
  )
}

