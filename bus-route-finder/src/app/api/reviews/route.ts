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

    const searchParams = request.nextUrl.searchParams
    const busId = searchParams.get("bus_id")

    let query = supabase.from("reviews").select("*").order("created_at", { ascending: false })

    if (busId) {
      query = query.eq("bus_id", busId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error fetching reviews:", error)
    return NextResponse.json([], { status: 500 })
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

    const { data, error } = await supabase
      .from("reviews")
      .insert([{ ...body, created_at: new Date().toISOString() }])
      .select()

    if (error) throw error

    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating review:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}
