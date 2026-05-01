import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: {
    default: 'GigKart — Hyperlocal Micro-Gig Marketplace',
    template: '%s | GigKart',
  },
  description:
    'Find local taskers for short-duration jobs or earn money completing tasks near you. Secure escrow payments, verified profiles.',
  keywords: ['gig economy', 'local jobs', 'tasker', 'freelance', 'India'],
  openGraph: {
    title: 'GigKart — Hyperlocal Micro-Gig Marketplace',
    description: 'Find local taskers or earn money completing tasks near you.',
    type: 'website',
    locale: 'en_IN',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen bg-sand-50 font-sans antialiased" suppressHydrationWarning>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
