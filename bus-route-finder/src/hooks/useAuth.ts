"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"

interface AuthUser extends User {
  is_contributor?: boolean
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      if (session?.user) {
        const { data } = await supabase
          .from("user_profiles")
          .select("is_contributor")
          .eq("user_id", session.user.id)
          .single()

        setUser({
          ...session.user,
          is_contributor: data?.is_contributor || false,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription?.unsubscribe()
  }, [])

  return { user, loading }
}
