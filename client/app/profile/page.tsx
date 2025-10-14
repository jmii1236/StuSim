import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardHeader } from "@/components/dashboard-header"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Full Name</Label>
              <Input id="profile-name" defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" type="email" defaultValue="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-password">New Password</Label>
              <Input id="profile-password" type="password" placeholder="Leave blank to keep current" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-ta-type">Type of TA</Label>
              <Select defaultValue="graduate">
                <SelectTrigger id="profile-ta-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undergraduate">Undergraduate TA</SelectItem>
                  <SelectItem value="graduate">Graduate TA</SelectItem>
                  <SelectItem value="professional">Professional Tutor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-experience">Length of Experience</Label>
              <Select defaultValue="1-2">
                <SelectTrigger id="profile-experience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-6">0-6 months</SelectItem>
                  <SelectItem value="6-12">6-12 months</SelectItem>
                  <SelectItem value="1-2">1-2 years</SelectItem>
                  <SelectItem value="2+">2+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full">Save Changes</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
