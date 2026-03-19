'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { excluirGC } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2, Loader2 } from 'lucide-react'

export function DeleteGCButton({ id, nome }: { id: string; nome: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await excluirGC(id)
        toast.success('GC excluído com sucesso.')
        router.push('/gcs')
        router.refresh()
      } catch (err: any) {
        toast.error(err.message ?? 'Erro ao excluir GC.')
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir GC &quot;{nome}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. As pessoas vinculadas a este GC terão o vínculo removido.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Confirmar exclusão
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
