import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription>Join StuSim to start your tutor training</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="Enter your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Create a password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ta-type">Type of TA</Label>
            <Select>
              <SelectTrigger id="ta-type">
                <SelectValue placeholder="Select TA type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="undergraduate">Undergraduate TA</SelectItem>
                <SelectItem value="graduate">Graduate TA</SelectItem>
                <SelectItem value="professional">Professional Tutor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="experience">Length of Experience</Label>
            <Select>
              <SelectTrigger id="experience">
                <SelectValue placeholder="Select experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-6">0-6 months</SelectItem>
                <SelectItem value="6-12">6-12 months</SelectItem>
                <SelectItem value="1-2">1-2 years</SelectItem>
                <SelectItem value="2+">2+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" asChild>
            <Link href="/dashboard">Create Account</Link>
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
