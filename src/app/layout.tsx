import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { SiteHeader } from '@/components/site-header'
import { getCurrentUser } from '@/lib/auth'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CVMBS Research Day',
  description:
    "Colorado State University College of Veterinary Medicine and Biomedical Sciences Research Day — abstract submission, schedule, and event info.",
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser()

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 min-h-screen flex flex-col`}>
        <SiteHeader
          signedIn={!!user}
          isAdmin={user?.isAdmin ?? false}
          displayEmail={user?.email}
        />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
