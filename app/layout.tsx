import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Farm AI - Smart Crop Advisory System",
  description: "Empowering Small & Marginal Farmers with Smart Agricultural Solutions",
  generator: "Farm AI",
  keywords: ["farming", "agriculture", "AI", "crop advisory", "disease detection", "smart farming"],
  authors: [{ name: "Farm AI Team" }],
  viewport: "width=device-width, initial-scale=1",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className="font-sans bg-background text-foreground">
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
