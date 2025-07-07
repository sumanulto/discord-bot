import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import ToasterClient from "@/components/ui/toaster-client"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "KM Dashboard",
  description: "Control your Discord music bot from the web",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} cz-shortcut-listen="true">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <ToasterClient />
        </ThemeProvider>
      </body>
    </html>
  )
}
