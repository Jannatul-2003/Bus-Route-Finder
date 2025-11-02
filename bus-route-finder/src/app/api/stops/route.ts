import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // Handle errors silently
            }
          },
        },
      },
    )

    const { data, error } = await supabase.from("stops").select("*")

    if (error) throw error

    return Response.json(data || [])
  } catch (error) {
    console.error("[v0] Error fetching stops:", error)
    return Response.json([], { status: 500 })
  }
}
