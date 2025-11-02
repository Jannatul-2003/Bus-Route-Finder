import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
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

    const { data, error } = await supabase.from("user_settings").select("*").single()

    if (error && error.code !== "PGRST116") throw error

    return NextResponse.json(data || {})
  } catch (error) {
    console.error("[v0] Error fetching user settings:", error)
    return NextResponse.json({}, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()

    const { data, error } = await supabase.from("user_settings").upsert([body]).select().single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error saving user settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
