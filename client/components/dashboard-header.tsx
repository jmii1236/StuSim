import Link from "next/link"
import { Button } from "@/components/ui/button"

export function DashboardHeader() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-bold">
          StuSim
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/history" className="text-sm font-medium hover:text-primary transition-colors">
            History
          </Link>
          <Link href="/profile" className="text-sm font-medium hover:text-primary transition-colors">
            Profile
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">Sign Out</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
