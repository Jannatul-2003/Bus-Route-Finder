"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { auth } from "@/lib/supabase/auth"

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

//   const handleRegister = async (e: React.FormEvent) => {
//   e.preventDefault()
//   setError(null)

//   if (password !== confirmPassword) {
//     setError("Passwords do not match")
//     return
//   }

//   if (password.length < 6) {
//     setError("Password must be at least 6 characters")
//     return
//   }

//   setLoading(true)

//   try {
//     const { data: signUpData, error: signUpError } = await auth.signUp(email, password)
//     if (signUpError) {
//       setError(signUpError.message)
//     } else if (signUpData?.user) {
//       // ✅ Create profile row for the new contributor
//       const supabase = getSupabaseClient()
//       const { error: profileError } = await supabase.from("user_profiles").insert({
//         user_id: signUpData.user.id,
//         is_contributor: true, // mark as contributor
//       })

//       if (profileError) {
//         console.error("Error creating user profile:", profileError)
//       }

//       setSuccess(true)
//       setTimeout(() => {
//         router.push("/auth/login")
//       }, 2000)
//     }
//   } catch (err) {
//     setError("An unexpected error occurred")
//   } finally {
//     setLoading(false)
//   }
// }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      const { error } = await auth.signUp(email, password)
      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <h2 className="text-lg font-semibold">Registration Successful!</h2>
              <p className="text-sm text-muted-foreground">Check your email to verify your account.</p>
              <p className="text-xs text-muted-foreground">Redirecting to login...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Become a Contributor</CardTitle>
          <CardDescription>Register to manage bus routes</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
