// import { getSupabaseServer } from "@/lib/supabase/server"
// import { NextResponse } from "next/server"

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url)
//     const query = searchParams.get("q")

//     if (!query) {
//       return NextResponse.json({ error: "Query parameter required" }, { status: 400 })
//     }

//     const supabase = await getSupabaseServer()
//     const { data, error } = await supabase.from("stops").select("*").ilike("name", `%${query}%`).limit(10)

//     if (error) throw error

//     return NextResponse.json(data || [])
//   } catch (error) {
//     console.error("[v0] Error searching stops:", error)
//     return NextResponse.json({ error: "Failed to search stops" }, { status: 500 })
//   }
// }
import { getSupabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Query parameter required" }, { status: 400 })
    }

    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("YOUR_SUPABASE") ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes("YOUR_SUPABASE")
    ) {
      return NextResponse.json(
        {
          error:
            "Supabase credentials not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.",
        },
        { status: 500 },
      )
    }

    const supabase = await getSupabaseServer()
    const { data, error } = await supabase.from("stops").select("*").ilike("name", `%${query}%`).limit(10)

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error searching stops:", error)
    return NextResponse.json({ error: "Failed to search stops", details: String(error) }, { status: 500 })
  }
}
