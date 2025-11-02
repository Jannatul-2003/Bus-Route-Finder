import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "PLACEHOLDER_URL"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "PLACEHOLDER_KEY"

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export const auth = {
  signUp: async (email: string, password: string) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
  process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
  `${window.location.origin}/auth/callback`,

        // emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/confirm`,
      },
    })
  },

  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  },

  signOut: async () => {
    return await supabase.auth.signOut()
  },

  getCurrentUser: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  },

  getSession: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  },
}
