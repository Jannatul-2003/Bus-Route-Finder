"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"

export interface AuthUser extends User {
  is_contributor?: boolean
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseClient()

    const fetchUserProfile = async (sessionUser: User): Promise<AuthUser> => {
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("is_contributor")
          .eq("id", sessionUser.id)
          .single()

        if (error) {
          // If profile doesn't exist, create it with default values
          if (error.code === 'PGRST116') {
            const { error: insertError } = await supabase
              .from("user_profiles")
              .insert({
                id: sessionUser.id,
                email: sessionUser.email,
                is_contributor: false
              })

            if (insertError) {
              console.error('Error creating user profile:', insertError)
              setError('Failed to create user profile')
            }

            return {
              ...sessionUser,
              is_contributor: false,
            }
          }
          
          console.error('Error fetching user profile:', error)
          setError('Failed to fetch user profile')
          return {
            ...sessionUser,
            is_contributor: false,
          }
        }

        return {
          ...sessionUser,
          is_contributor: data?.is_contributor || false,
        }
      } catch (err) {
        console.error('Unexpected error fetching user profile:', err)
        setError('Unexpected error occurred')
        return {
          ...sessionUser,
          is_contributor: false,
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      setError(null)
      
      if (session?.user) {
        const userWithProfile = await fetchUserProfile(session.user)
        setUser(userWithProfile)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription?.unsubscribe()
  }, [])

  return { user, loading, error }
}
