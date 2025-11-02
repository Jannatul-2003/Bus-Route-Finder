import { getSupabaseServer } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServer()
    const { data, error } = await supabase.from("buses").select("*").eq("id", id).single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching bus:", error)
    return NextResponse.json({ error: "Failed to fetch bus" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServer()
    const body = await request.json()

    const { data, error } = await supabase
      .from("buses")
      .update({ name: body.name, status: body.status })
      .eq("id", id)
      .select()

    if (error) throw error

    return NextResponse.json(data?.[0])
  } catch (error) {
    console.error("[v0] Error updating bus:", error)
    return NextResponse.json({ error: "Failed to update bus" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServer()
    const { error } = await supabase.from("buses").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting bus:", error)
    return NextResponse.json({ error: "Failed to delete bus" }, { status: 500 })
  }
}
