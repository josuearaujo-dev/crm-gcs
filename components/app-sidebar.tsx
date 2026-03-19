'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, Users, Home, UserPlus, PlusCircle, LogIn, CalendarCheck, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { LogoutButton } from '@/components/logout-button'

const navItems = [
  { href: '/mapa', label: 'Mapa Geral', icon: Map },
  { href: '/presencas', label: 'Presenças', icon: CalendarCheck },
  { href: '/presencas/historico', label: 'Histórico', icon: History },
  { href: '/gcs', label: 'Grupos de Célula', icon: Home },
  { href: '/pessoas', label: 'Pessoas', icon: Users },
]

const actionItems = [
  { href: '/gcs/novo', label: 'Novo GC', icon: PlusCircle },
  { href: '/pessoas/nova', label: 'Nova Pessoa', icon: UserPlus },
]

type Props = {
  isAuthenticated: boolean
  isSuperadmin: boolean
}

export function AppSidebar({ isAuthenticated, isSuperadmin }: Props) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  React.useEffect(() => {
    // Em telas menores, deixamos o menu recolhido por padrão
    setIsCollapsed(isMobile)
  }, [isMobile])

  // Mobile: barra fixa inferior (não ocupa layout lateral) para não atrapalhar o mapa.
  if (isMobile) {
    const baseLinkClasses = (href: string) =>
      cn(
        'flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl transition-colors',
        pathname === href
          ? 'bg-sidebar-accent/70 text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/90 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/20'
      )

    return (
      <>
        {isAuthenticated ? (
          <div className="fixed right-3 top-3 z-50">
            <LogoutButton compact className="w-auto p-2! h-9! min-w-0! gap-0!" />
          </div>
        ) : null}

        <div
          className={cn(
            'fixed left-0 right-0 bottom-0 z-50',
            'bg-sidebar/95 backdrop-blur border-t border-sidebar-border shadow-lg text-sidebar-foreground',
            'pt-1 pb-[calc(8px+env(safe-area-inset-bottom))]'
          )}
        >
          <div className="flex items-center justify-around px-3">
          <Link href="/mapa" className={baseLinkClasses('/mapa')}>
            <Map className="w-6 h-6" />
            <span className="text-[10px] leading-none">Mapa</span>
          </Link>

            {isAuthenticated ? (
              <>
                <Link href="/pessoas/nova" className={baseLinkClasses('/pessoas/nova')}>
                  <UserPlus className="w-6 h-6" />
                  <span className="text-[10px] leading-none">Pessoa</span>
                </Link>
                <Link href="/presencas" className={baseLinkClasses('/presencas')}>
                  <CalendarCheck className="w-6 h-6" />
                  <span className="text-[10px] leading-none">Presenças</span>
                </Link>
                <Link href="/presencas/historico" className={baseLinkClasses('/presencas/historico')}>
                  <History className="w-6 h-6" />
                  <span className="text-[10px] leading-none">Histórico</span>
                </Link>
              </>
            ) : (
              <Link href="/login" className={baseLinkClasses('/login')}>
                <LogIn className="w-6 h-6" />
                <span className="text-[10px] leading-none">Entrar</span>
              </Link>
            )}
          </div>
        </div>
      </>
    )
  }

  return (
    <aside
      className={cn(
        'flex flex-col min-h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0 transition-[width] duration-200 ease-out',
        isCollapsed ? 'w-16' : 'w-60'
      )}
      onMouseEnter={() => !isMobile && setIsCollapsed(false)}
      onMouseLeave={() => !isMobile && setIsCollapsed(true)}
    >
      {/* Logo / título */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
          <Home className="w-4 h-4 text-primary-foreground" />
        </div>
        {!isCollapsed && (
          <span className="font-semibold text-base text-sidebar-foreground tracking-tight">
            GC Manager
          </span>
        )}
      </div>

      {/* Navegação principal */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {!isCollapsed && (
          <p className="px-2 pb-1 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
            Visualizar
          </p>
        )}
        {(isAuthenticated ? navItems : navItems.filter((x) => x.href === '/mapa')).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              isCollapsed && 'justify-center'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>{label}</span>}
          </Link>
        ))}

        <div className={cn('mt-4', isCollapsed && 'mt-0')}>
          {!isCollapsed && (
            <p className="px-2 pb-1 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
              Cadastrar
            </p>
          )}
          {isAuthenticated ? (
            <div className="flex flex-col">
              {isSuperadmin ? (
                <Link
                  href="/gcs/novo"
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-1',
                    pathname === '/gcs/novo'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                    isCollapsed && 'justify-center'
                  )}
                >
                  <PlusCircle className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span>Novo GC</span>}
                </Link>
              ) : null}

              <Link
                href="/pessoas/nova"
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-1',
                  pathname === '/pessoas/nova'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                  isCollapsed && 'justify-center'
                )}
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>Nova Pessoa</span>}
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-1',
                pathname === '/login'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                isCollapsed && 'justify-center'
              )}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Entrar</span>}
            </Link>
          )}

          {isAuthenticated ? (
            <div className={cn('mt-1', isCollapsed ? 'px-0' : 'px-1')}>
              <LogoutButton compact={isCollapsed} />
            </div>
          ) : null}
        </div>
      </nav>

      {/* Rodapé */}
      <div
        className={cn(
          'px-5 py-4 border-t border-sidebar-border text-xs text-sidebar-foreground/40 whitespace-nowrap overflow-hidden transition-opacity duration-200',
          isCollapsed ? 'opacity-0' : 'opacity-100'
        )}
      >
        GC Manager &copy; {new Date().getFullYear()}
      </div>
    </aside>
  )
}
