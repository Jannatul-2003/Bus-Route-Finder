import { getSupabaseServer } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServer()
    const { data, error } = await supabase.from("buses").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error fetching buses:", error)
    return NextResponse.json({ error: "Failed to fetch buses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer()
    const body = await request.json()

    const { data, error } = await supabase
      .from("buses")
      .insert([{ name: body.name, status: body.status || "active" }])
      .select()

    if (error) throw error

    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating bus:", error)
    return NextResponse.json({ error: "Failed to create bus" }, { status: 500 })
  }
}
