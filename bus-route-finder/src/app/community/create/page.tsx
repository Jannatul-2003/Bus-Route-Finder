"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { communityStore } from "@/lib/stores/communityStore"
import { useAuth } from "@/hooks/useAuth"
import { roleAuthService } from "@/lib/services/RoleAuthorizationService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function CreateCommunityPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    center_latitude: 0,
    center_longitude: 0,
    radius_meters: 1000
  })
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [authCheck, setAuthCheck] = React.useState<{ allowed: boolean; reason?: string } | null>(null)

  React.useEffect(() => {
    // Get user location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLocation(location)
          setFormData(prev => ({
            ...prev,
            center_latitude: location.lat,
            center_longitude: location.lng
          }))
        },
        (error) => {
          console.error("Error getting location:", error)
          setError("Unable to get your location. Please enter coordinates manually.")
        }
      )
    }
  }, [])

  React.useEffect(() => {
    // Check authorization when user data is available
    if (!authLoading) {
      const result = roleAuthService.canCreateCommunity(user)
      setAuthCheck(result)
    }
  }, [user, authLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const community = await communityStore.createCommunity(formData)
      if (community?.id) {
        // Generate slug from community name and use slug-based URL
        const communitySlug = community.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .trim()
        router.push(`/community/c/${communitySlug}`)
      } else {
        throw new Error("Failed to create community - no ID returned")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create community")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show access denied message if user cannot create communities
  if (authCheck && !authCheck.allowed) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Community</h1>
          <p className="text-muted-foreground">
            Start a new community for your area
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              Community creation is limited to contributors only
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
              <p className="font-medium">Contributor Access Required</p>
              <p className="text-sm mt-1">
                {authCheck.reason || "You need contributor privileges to create communities."}
              </p>
            </div>
            
            {!user ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Please log in to access community creation features.
                </p>
                <Button onClick={() => router.push('/auth/login')}>
                  Log In
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Contact an administrator to request contributor access, or explore existing communities instead.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => router.push('/community')}>
                    Browse Communities
                  </Button>
                  <Button variant="outline" onClick={() => router.back()}>
                    Go Back
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Enhanced Header */}
        <div className="mb-12 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent leading-tight">
              Create Community
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start a new community for your area and connect with fellow commuters
            </p>
            {user?.is_contributor && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-green-800">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">You have contributor access to create communities</span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Form Card */}
        <Card className="bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-sm border-border/50 shadow-xl">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl font-bold">Community Details</CardTitle>
            <CardDescription className="text-base">
              Fill in the details for your new community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Community Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter community name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe your community"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.center_latitude}
                  onChange={(e) => handleInputChange("center_latitude", parseFloat(e.target.value))}
                  placeholder="Latitude"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.center_longitude}
                  onChange={(e) => handleInputChange("center_longitude", parseFloat(e.target.value))}
                  placeholder="Longitude"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="radius">Radius (meters)</Label>
              <Input
                id="radius"
                type="number"
                value={formData.radius_meters}
                onChange={(e) => handleInputChange("radius_meters", parseInt(e.target.value))}
                placeholder="Community radius in meters"
                min={100}
                max={10000}
              />
            </div>

            {userLocation && (
              <div className="text-sm text-muted-foreground">
                Using your current location: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Community"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}