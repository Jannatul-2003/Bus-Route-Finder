import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Navigation } from "@/components/navigation"
import { Suspense } from "react"
import "./globals.css"
import { AuthProvider } from "./providers/AuthProvider"

export const metadata: Metadata = {
  title: "BusRoute - Smart Bus Transport App",
  description: "Plan your bus routes and read reviews with our modern transport app",
  generator: "Jannatul Ferdousi",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
        <Suspense fallback={<div>Loading...</div>}>
          <Navigation />
        </Suspense>
        </AuthProvider>
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
}
