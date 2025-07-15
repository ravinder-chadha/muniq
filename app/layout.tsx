import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MUNIQ by AJ - Where Diplomats Are Built',
  description: 'Join MUNIQ by AJ for comprehensive Model United Nations training. Learn diplomacy, public speaking, and global leadership skills through expert-led workshops.',
  generator: 'Next.js',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
