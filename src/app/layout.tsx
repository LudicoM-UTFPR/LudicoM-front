import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LudicoM - Sistema de Gestão Educacional',
  description: 'Sistema de gestão educacional LudicoM - UTFPR',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans">{children}</body>
    </html>
  )
}