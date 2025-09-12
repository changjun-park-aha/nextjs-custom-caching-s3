import { Geist, Geist_Mono } from 'next/font/google'
import '@workspace/ui/globals.css'
import type { Metadata } from 'next'
import { Navigation } from '../components/nav/navigation'
import { Providers } from './providers'

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: { default: '아하 DEV', template: '%s | 아하 DEV' },
  metadataBase: new URL('https://a-ha-dev.com'),
  openGraph: {
    title: '아하 DEV',
    description: '아하 개발용 커뮤니티',
    images: [`/api/og?title=아하 DEV`],
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <Providers>
          <Navigation />
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
