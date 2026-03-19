import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const _plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-heading' })

export const metadata: Metadata = {
  title: 'GC Manager — Gestão de Grupos de Célula',
  description: 'Gerencie seus grupos de célula, membros e localizações em um só lugar.',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${_inter.variable} ${_plusJakarta.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}
