import React from "react"
import Link from "next/link"
import { Camera } from "lucide-react"
import { SimpleThemeToggle } from "@/components/theme-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">GroupSnap</span>
            </Link>
            <SimpleThemeToggle />
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
