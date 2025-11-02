"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Loader2, Trash2, Edit2, Plus } from "lucide-react"
import { auth } from "@/lib/supabase/auth"
import { supabase } from "@/lib/supabase/auth"

interface Bus {
  id: string
  name: string
  status: string
}

export default function BusManagement() {
  const router = useRouter()
  const [buses, setBuses] = useState<Bus[]>([])
  const [filteredBuses, setFilteredBuses] = useState<Bus[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const checkAuthAndFetchBuses = async () => {
      try {
        const user = await auth.getCurrentUser()
        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("is_contributor")
          .eq("id", user.id)
          .single()

        if (!profile?.is_contributor) {
          router.push("/")
          return
        }

        setAuthorized(true)

        const { data } = await supabase.from("buses").select("*").order("name")
        setBuses(data || [])
        setFilteredBuses(data || [])
      } catch (error) {
        console.error("Error:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchBuses()
  }, [router])

  useEffect(() => {
    const filtered = buses.filter((bus) => bus.name.toLowerCase().includes(searchQuery.toLowerCase()))
    setFilteredBuses(filtered)
  }, [searchQuery, buses])

  const handleDelete = async (busId: string) => {
    if (!confirm("Are you sure you want to delete this bus?")) return

    setDeleting(busId)
    try {
      await supabase.from("buses").delete().eq("id", busId)
      setBuses(buses.filter((b) => b.id !== busId))
    } catch (error) {
      console.error("Error deleting bus:", error)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Access Denied</p>
              <p className="text-sm text-red-800">Only contributors can manage buses.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-balance">Bus Management</h1>
          <p className="text-muted-foreground text-pretty">Add, edit, or delete bus routes</p>
        </div>
        <Button onClick={() => router.push("/bus-management/add")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Bus
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <Input
            placeholder="Search buses by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Buses List */}
      {filteredBuses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? "No buses found matching your search." : "No buses available. Add one to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBuses.map((bus) => (
            <Card key={bus.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{bus.name}</h3>
                  <p className="text-sm text-muted-foreground">Status: {bus.status}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push(`/bus-management/edit/${bus.id}`)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(bus.id)}
                    disabled={deleting === bus.id}
                  >
                    {deleting === bus.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
