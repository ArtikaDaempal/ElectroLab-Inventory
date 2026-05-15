import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lab Elektro Inventaris',
  description: 'Sistem Manajemen Inventaris Laboratorium Elektronika',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body>
        <TooltipProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                border: '1px solid rgba(20,184,166,0.2)',
                color: '#e2e8f0',
              },
            }}
          />
        </TooltipProvider>
      </body>
    </html>
  )
}
