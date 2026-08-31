import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Defense Lab | Mastercard Innovation Challenge 2026',
  description: 'Adversarial AI Red-Team / Blue-Team Defense System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-surface text-slate-200 font-mono antialiased">
        {children}
      </body>
    </html>
  )
}
