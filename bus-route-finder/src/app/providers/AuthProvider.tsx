// "use client"

// import { createContext, useContext, useEffect, useState } from "react"
// import { getSupabaseClient } from "@/lib/supabase/client"
// import type { User, Session } from "@supabase/supabase-js"

// interface AuthContextType {
//   user: User | null
//   loading: boolean
// }

// const AuthContext = createContext<AuthContextType>({
//   user: null,
//   loading: true,
// })

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null)
//   const [loading, setLoading] = useState(true)
//   const supabase = getSupabaseClient()

//   useEffect(() => {
//     // 1️⃣ Load any existing session (from cookies)
//     supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
//       setUser(session?.user ?? null)
//       setLoading(false)
//     })

//     // 2️⃣ Listen for any future auth changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
//       setUser(session?.user ?? null)
//       setLoading(false)
//     })

//     return () => subscription.unsubscribe()
//   }, [supabase])

//   return (
//     <AuthContext.Provider value={{ user, loading }}>
//       {children}
//     </AuthContext.Provider>
//   )
// }

// export function useAuth() {
//   return useContext(AuthContext)
// }
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthUser extends User {
  is_contributor?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        await fetchProfile(data.session.user.id, data.session.user);
      }
      setLoading(false);
    };

    const fetchProfile = async (userId: string, sessionUser: User) => {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("is_contributor")
        .eq("user_id", userId)
        .single();

      setUser({
        ...sessionUser,
        is_contributor: profile?.is_contributor || false,
      });
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (session?.user) fetchProfile(session.user.id, session.user);
      else setUser(null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
