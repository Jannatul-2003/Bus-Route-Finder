"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, Edit2, BusIcon, MapPin, ChevronDown } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

interface Bus {
  id: string
  name: string
  status: "active" | "inactive"
  created_at: string
}

interface RouteStop {
  id: string
  stop_order: number
  direction: string
  stops: {
    id: string
    name: string
    latitude: number
    longitude: number
  }
}

export default function BusesPage() {
  const [buses, setBuses] = useState<Bus[]>([])
  const [filteredBuses, setFilteredBuses] = useState<Bus[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBus, setEditingBus] = useState<Bus | null>(null)
  const [formData, setFormData] = useState({ name: "", status: "active" })
  const [searchQuery, setSearchQuery] = useState("")
  const [isContributor, setIsContributor] = useState(false)
  const [expandedBus, setExpandedBus] = useState<string | null>(null)
  const [routeStops, setRouteStops] = useState<{ [key: string]: RouteStop[] }>({})
  const [loadingStops, setLoadingStops] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    checkContributorStatus()
    fetchBuses()
  }, [])

  const checkContributorStatus = async () => {
    try {
      const supabase = getSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase.from("user_profiles").select("is_contributor").eq("id", user.id).single()

        setIsContributor(data?.is_contributor || false)
      }
    } catch (error) {
      console.error("[v0] Error checking contributor status:", error)
    }
  }

  const fetchBuses = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/buses")
      const data = await response.json()
      setBuses(data)
      setFilteredBuses(data)
    } catch (error) {
      console.error("[v0] Error fetching buses:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRouteStops = async (busId: string) => {
    if (routeStops[busId]) {
      return
    }

    try {
      setLoadingStops((prev) => ({ ...prev, [busId]: true }))
      const response = await fetch(`/api/route-stops?bus_id=${busId}`)
      const data = await response.json()
      setRouteStops((prev) => ({ ...prev, [busId]: data }))
    } catch (error) {
      console.error("[v0] Error fetching route stops:", error)
    } finally {
      setLoadingStops((prev) => ({ ...prev, [busId]: false }))
    }
  }

  useEffect(() => {
    const filtered = buses.filter((bus) => bus.name.toLowerCase().includes(searchQuery.toLowerCase()))
    setFilteredBuses(filtered)
  }, [searchQuery, buses])

  const toggleBusExpand = (busId: string) => {
    if (expandedBus === busId) {
      setExpandedBus(null)
    } else {
      setExpandedBus(busId)
      fetchRouteStops(busId)
    }
  }

  const handleAddBus = async () => {
    if (!formData.name.trim()) return

    try {
      const response = await fetch("/api/buses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newBus = await response.json()
        setBuses([newBus, ...buses])
        setFormData({ name: "", status: "active" })
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error("[v0] Error adding bus:", error)
    }
  }

  const handleUpdateBus = async () => {
    if (!editingBus || !formData.name.trim()) return

    try {
      const response = await fetch(`/api/buses/${editingBus.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedBus = await response.json()
        setBuses(buses.map((b) => (b.id === editingBus.id ? updatedBus : b)))
        setFormData({ name: "", status: "active" })
        setEditingBus(null)
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error("[v0] Error updating bus:", error)
    }
  }

  const handleDeleteBus = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bus?")) return

    try {
      const response = await fetch(`/api/buses/${id}`, { method: "DELETE" })

      if (response.ok) {
        setBuses(buses.filter((b) => b.id !== id))
      }
    } catch (error) {
      console.error("[v0] Error deleting bus:", error)
    }
  }

  const openEditDialog = (bus: Bus) => {
    setEditingBus(bus)
    setFormData({ name: bus.name, status: bus.status })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingBus(null)
    setFormData({ name: "", status: "active" })
  }

  const groupStopsByRoute = (stops: RouteStop[]) => {
    const grouped: { [key: number]: RouteStop } = {}

    stops.forEach((stop) => {
      if (!grouped[stop.stop_order]) {
        grouped[stop.stop_order] = stop
      }
    })

    return Object.values(grouped).sort((a, b) => a.stop_order - b.stop_order)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-balance">{isContributor ? "Bus Management" : "Browse Buses"}</h1>
        <p className="text-muted-foreground text-pretty">
          {isContributor ? "Manage your bus fleet" : "Search and view bus routes and stops"}
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Search buses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        {isContributor && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingBus(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Bus
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBus ? "Edit Bus" : "Add New Bus"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Bus Name</label>
                  <Input
                    placeholder="e.g., Route 42"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "active" | "inactive",
                      })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <Button
                  onClick={editingBus ? handleUpdateBus : handleAddBus}
                  className="w-full"
                  disabled={!formData.name.trim()}
                >
                  {editingBus ? "Update Bus" : "Add Bus"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading buses...</p>
          </CardContent>
        </Card>
      ) : filteredBuses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BusIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isContributor ? "No buses yet. Create your first bus!" : "No buses found matching your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBuses.map((bus) => (
            <Card key={bus.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <button
                      onClick={() => toggleBusExpand(bus.id)}
                      className="flex items-center gap-2 hover:opacity-70 transition"
                    >
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${expandedBus === bus.id ? "rotate-180" : ""}`}
                      />
                      <h3 className="font-semibold text-lg">{bus.name}</h3>
                    </button>
                    <div className="flex items-center gap-2 mt-2 ml-7">
                      <Badge variant={bus.status === "active" ? "default" : "secondary"}>{bus.status}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(bus.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {isContributor && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(bus)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteBus(bus.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {expandedBus === bus.id && (
                  <div className="mt-4 pt-4 border-t">
                    {loadingStops[bus.id] ? (
                      <p className="text-sm text-muted-foreground">Loading stops...</p>
                    ) : routeStops[bus.id]?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No stops configured for this bus.</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Route Stops:</p>
                        {groupStopsByRoute(routeStops[bus.id] || []).map((stop) => (
                          <div key={stop.id} className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div>
                              <p className="font-medium">{stop.stops.name}</p>
                              <p className="text-xs text-muted-foreground">Stop #{stop.stop_order}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
