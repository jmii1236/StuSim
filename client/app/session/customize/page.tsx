"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DashboardHeader } from "@/components/dashboard-header"
import { Shuffle } from "lucide-react"

export default function CustomizeSessionPage() {
  const [csBackground, setCsBackground] = useState("")
  const [personality, setPersonality] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [issue, setIssue] = useState("")

  const randomizeSettings = () => {
    const backgrounds = ["beginner", "intermediate", "advanced"]
    const personalities = ["engaged", "shy", "frustrated", "confident"]
    const difficulties = ["easy", "medium", "hard"]
    const issues = [
      "Debugging a for loop that's not iterating correctly",
      "Understanding how recursion works with base cases",
      "Fixing an off-by-one error in array indexing",
      "Understanding the difference between pass-by-value and pass-by-reference",
      "Implementing a binary search algorithm",
    ]

    setCsBackground(backgrounds[Math.floor(Math.random() * backgrounds.length)])
    setPersonality(personalities[Math.floor(Math.random() * personalities.length)])
    setDifficulty(difficulties[Math.floor(Math.random() * difficulties.length)])
    setIssue(issues[Math.floor(Math.random() * issues.length)])
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto p-6 max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Customize Your Session</CardTitle>
                <CardDescription>Configure the AI student for your practice session</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={randomizeSettings}>
                <Shuffle className="w-4 h-4 mr-2" />
                Randomize
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cs-background">Computer Science Background</Label>
              <Select value={csBackground} onValueChange={setCsBackground}>
                <SelectTrigger id="cs-background">
                  <SelectValue placeholder="Select background level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner (CS1)</SelectItem>
                  <SelectItem value="intermediate">Intermediate (CS2)</SelectItem>
                  <SelectItem value="advanced">Advanced (Data Structures)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personality">Student Personality</Label>
              <Select value={personality} onValueChange={setPersonality}>
                <SelectTrigger id="personality">
                  <SelectValue placeholder="Select personality type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engaged">Engaged & Curious</SelectItem>
                  <SelectItem value="shy">Shy & Reserved</SelectItem>
                  <SelectItem value="frustrated">Frustrated & Confused</SelectItem>
                  <SelectItem value="confident">Overconfident</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue">Student's Issue</Label>
              <Textarea
                id="issue"
                placeholder="Describe what the student is struggling with (e.g., debugging a loop, understanding recursion)"
                rows={4}
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
              />
            </div>

            <Button className="w-full" size="lg" asChild>
              <Link href="/session/active">Start Session</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
