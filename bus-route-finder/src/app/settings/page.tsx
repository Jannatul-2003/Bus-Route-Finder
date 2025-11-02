"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle, LogOut, LogIn, Loader2 } from "lucide-react"
import { auth } from "@/lib/supabase/auth"
import { supabase } from "@/lib/supabase/auth"

interface UserProfile {
  id: string
  email: string
  is_contributor: boolean
}

export default function Settings() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await auth.getCurrentUser()
        if (currentUser) {
          const { data } = await supabase.from("user_profiles").select("*").eq("id", currentUser.id).single()

          setUser(data)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error logging out:", error)
    } finally {
      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-balance mb-2">Settings</h1>
        <p className="text-muted-foreground text-pretty">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        {/* User Account Section */}
        {user ? (
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">
                  {user.is_contributor ? (
                    <span className="text-green-600">Contributor</span>
                  ) : (
                    <span className="text-gray-600">Regular User</span>
                  )}
                </p>
              </div>

              <Button variant="destructive" onClick={handleLogout} disabled={loggingOut} className="w-full">
                {loggingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Not Logged In</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign in as a contributor to manage bus routes and access advanced features.
              </p>
              <Button className="w-full" onClick={() => router.push("/auth/login")}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/auth/register")}>
                Register as Contributor
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Help & Support Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Help & Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="font-semibold mb-1">Getting Started</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Learn how to use BusRoute to plan your journeys and manage bus routes as a contributor.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">For Contributors</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Register or sign in to add, edit, or delete bus routes in the system.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">For Regular Users</h3>
              <p className="text-sm text-muted-foreground">
                Use the route planner to search for buses and find the best journey to your destination.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
