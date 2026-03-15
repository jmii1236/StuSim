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
import { ToggleSlider } from "@/components/ui/toggle-slider";

export default function CustomizeSessionPage() {
  const [csBackground, setCsBackground] = useState("")
  const [personality, setPersonality] = useState("")
  const [engagementLevel, setEngagementLevel] = useState("")
  const [issue, setIssue] = useState("")
  const [codeToggle, setCodeToggle] = useState(false);
  const [codeLanguage, setCodeLangauge] = useState("C++");
  const [usePersona, setUsePersona] = useState("");

  const randomizeSettings = () => {
    const backgrounds = ["beginner", "intermediate", "advanced"]
    const personalities = ["engaged", "shy", "frustrated"]
    const engagementLevels = ["low", "medium", "high"]
    const issues = [
      "Debugging a for loop that's not iterating correctly",
      "Understanding how recursion works with base cases",
      "Fixing an off-by-one error in array indexing",
      "Understanding the difference between pass-by-value and pass-by-reference",
      "Implementing a binary search algorithm",
    ]

    setCsBackground(backgrounds[Math.floor(Math.random() * backgrounds.length)])
    setPersonality(personalities[Math.floor(Math.random() * personalities.length)])
    setEngagementLevel(engagementLevels[Math.floor(Math.random() * engagementLevels.length)])
    setIssue(issues[Math.floor(Math.random() * issues.length)])
    setUsePersona("")
  }

  const loadMiddleMobolaji = () => {
    setCsBackground("intermediate")
    setPersonality("shy")
    setEngagementLevel("medium")
    setIssue("Reversing a linked list using recursion - struggling with base cases and pointer assignments")
    setCodeToggle(true)
    setCodeLangauge("C++")
    setUsePersona("mobolaji")
  }

  const loadStriverSatya = () => {
    setCsBackground("intermediate")
    setPersonality("engaged")
    setEngagementLevel("high")
    setIssue("Reversing a linked list using recursion - close to solution but making a small mistake with pointer reassignment")
    setCodeToggle(true)
    setCodeLangauge("C++")
    setUsePersona("satya")
  }

  const loadAloofAsh = () => {
    setCsBackground("intermediate")
    setPersonality("frustrated")
    setEngagementLevel("low")
    setIssue("Reversing a linked list using recursion - missing fundamental understanding of recursion and base cases")
    setCodeToggle(true)
    setCodeLangauge("C++")
    setUsePersona("ash")
  }

  function ToggleFunction() {
    setCodeToggle(prev => !prev);
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
                  <SelectItem value="beginner">Beginner - Low debugging expertise</SelectItem>
                  <SelectItem value="intermediate">Intermediate - Medium debugging expertise</SelectItem>
                  <SelectItem value="advanced">Advanced - High debugging expertise</SelectItem>
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
                  <SelectItem value="engaged">Engaged & Curious - Growth Mindset</SelectItem>
                  <SelectItem value="shy">Shy & Reserved / Overconfident - Mixed Mindset</SelectItem>
                  <SelectItem value="frustrated">Frustrated & Confused - Fixed Mindset</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="engagement-level">Student Engagement Level</Label>
              <Select value={engagementLevel} onValueChange={setEngagementLevel}>
                <SelectTrigger id="engagement-level">
                  <SelectValue placeholder="Select engagement level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low interest in CS</SelectItem>
                  <SelectItem value="medium">Medium interest in CS</SelectItem>
                  <SelectItem value="high">High interest in CS</SelectItem>
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

            <div className="space-y-2">
              <Label>Has Coding Questions
                <ToggleSlider onChecked={ToggleFunction} isChecked={codeToggle} tooltip={"Toggle to allow coding questions with editor."} />     
                {codeToggle ? 
                  <Select value={codeLanguage} onValueChange={setCodeLangauge}>
                    <SelectTrigger id="codeLanguage">
                      <SelectValue placeholder="Select Coding Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Javascript">Javascript</SelectItem>
                      <SelectItem value="Python">Python</SelectItem>
                      <SelectItem value="C++">C++</SelectItem>
                      <SelectItem value="C#">C#</SelectItem>
                      <SelectItem value="Java">Java</SelectItem>
                      <SelectItem value="Go">Go</SelectItem>
                      <SelectItem value="Rust">Rust</SelectItem>
                    </SelectContent> 
                  </Select> : null}
                    
              </Label>
            </div>

            <div className="border-t pt-6 space-y-3">
              <Label className="text-base">Pre-set Student Personas</Label>
              <p className="text-sm text-muted-foreground">Quick-load a researched student persona with preset characteristics</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  onClick={loadMiddleMobolaji}
                  className={usePersona === "mobolaji" ? "border-primary bg-primary/10" : ""}
                >
                  Middle Mobolaji
                </Button>
                <Button 
                  variant="outline" 
                  onClick={loadStriverSatya}
                  className={usePersona === "satya" ? "border-primary bg-primary/10" : ""}
                >
                  Striver Satya
                </Button>
                <Button 
                  variant="outline" 
                  onClick={loadAloofAsh}
                  className={usePersona === "ash" ? "border-primary bg-primary/10" : ""}
                >
                  Aloof Ash
                </Button>
              </div>
            </div>

            <Button className="w-full" size="lg" asChild>
              <Link href={{
                pathname: "/session/active", 
                query: {
                  csBackground: csBackground, 
                  personality: personality, 
                  engagementLevel: engagementLevel,
                  issue: issue, 
                  codeToggle: codeToggle, 
                  codeLanguage: codeLanguage,
                  usePersona: usePersona
                }
              }}>
                Start Session
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}