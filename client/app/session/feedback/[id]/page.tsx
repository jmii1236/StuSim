import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { Download, ThumbsUp, ThumbsDown } from "lucide-react"

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Session Feedback</h1>
            <p className="text-muted-foreground">Session #1 • Intermediate • 30 minutes</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Overall Score</CardDescription>
              <CardTitle className="text-4xl text-primary">8.5/10</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Engagement</CardDescription>
              <CardTitle className="text-4xl text-secondary">9.0/10</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Clarity</CardDescription>
              <CardTitle className="text-4xl">8.0/10</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Explanation Quality</span>
                  <span className="text-sm text-muted-foreground">9/10</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "90%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Active Listening</span>
                  <span className="text-sm text-muted-foreground">8/10</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: "80%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Problem Solving Guidance</span>
                  <span className="text-sm text-muted-foreground">8/10</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "80%" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Moments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-green-900">Great Explanation (12:34)</div>
                  <p className="text-sm text-green-700 mt-1">
                    "Let's break down recursion step by step..." - Clear, patient explanation that helped student
                    understand
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <ThumbsDown className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-red-900">Missed Opportunity (18:22)</div>
                  <p className="text-sm text-red-700 mt-1">
                    Student showed confusion but you moved on too quickly. Consider checking for understanding more
                    frequently.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Transcript</CardTitle>
              <CardDescription>Full conversation recording</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <div className="flex gap-3">
                  <div className="font-semibold text-sm text-muted-foreground w-16">00:12</div>
                  <div className="flex-1">
                    <span className="font-semibold">You:</span> Hi! What can I help you with today?
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="font-semibold text-sm text-muted-foreground w-16">00:18</div>
                  <div className="flex-1">
                    <span className="font-semibold">Student:</span> I'm confused about how recursion works...
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="font-semibold text-sm text-muted-foreground w-16">00:25</div>
                  <div className="flex-1">
                    <span className="font-semibold">You:</span> Let's break it down step by step...
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
