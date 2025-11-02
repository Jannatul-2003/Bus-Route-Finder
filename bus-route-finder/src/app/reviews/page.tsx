"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Star, Search, MessageSquare, User, Calendar, Loader2 } from "lucide-react"

interface Bus {
  id: string
  name: string
  status: string
}

interface Review {
  id: string
  bus_id: string
  bus_name: string
  rating: number
  author: string
  created_at: string
  comment: string
}

export default function BusReviews() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBusId, setSelectedBusId] = useState("")
  const [selectedBusName, setSelectedBusName] = useState("")
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: "",
  })
  const [buses, setBuses] = useState<Bus[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const response = await fetch("/api/buses")
        if (response.ok) {
          const data = await response.json()
          setBuses(data.filter((b: Bus) => b.status === "active"))
        }
      } catch (error) {
        console.error("[v0] Error fetching buses:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBuses()
  }, [])

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const url = selectedBusId ? `/api/reviews?bus_id=${selectedBusId}` : "/api/reviews"
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setReviews(data)
        }
      } catch (error) {
        console.error("[v0] Error fetching reviews:", error)
      }
    }

    if (buses.length > 0) {
      fetchReviews()
    }
  }, [selectedBusId, buses])

  const filteredBusRoutes = useMemo(() => {
    return buses.filter((bus) => bus.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [searchTerm, buses])

  const filteredReviews = useMemo(() => {
    if (!selectedBusId) return reviews
    return reviews.filter((review) => review.bus_id === selectedBusId)
  }, [reviews, selectedBusId])

  const averageRating = useMemo(() => {
    if (filteredReviews.length === 0) return "0"
    const sum = filteredReviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / filteredReviews.length).toFixed(1)
  }, [filteredReviews])

  const handleBusSelect = (bus: Bus) => {
    setSelectedBusId(bus.id)
    setSelectedBusName(bus.name)
    setSearchTerm("")
  }

  const handleSubmitReview = async () => {
    if (selectedBusId && newReview.rating > 0 && newReview.comment.trim()) {
      setSubmittingReview(true)
      try {
        const response = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bus_id: selectedBusId,
            bus_name: selectedBusName,
            rating: newReview.rating,
            author: "You",
            comment: newReview.comment,
          }),
        })

        if (response.ok) {
          const newReviewData = await response.json()
          setReviews([newReviewData, ...reviews])
          setNewReview({ rating: 0, comment: "" })
          setIsDialogOpen(false)
        }
      } catch (error) {
        console.error("[v0] Error submitting review:", error)
      } finally {
        setSubmittingReview(false)
      }
    }
  }

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={() => interactive && onRatingChange?.(star)}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-balance mb-2">Bus Reviews</h1>
        <p className="text-muted-foreground text-pretty">
          Search for bus routes and read reviews from other passengers
        </p>
      </div>

      {/* Bus Search */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Find a Bus Route
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Type to search bus routes (e.g., 'Route 42', 'Express', 'Downtown')"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {searchTerm && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{filteredBusRoutes.length} route(s) found</p>
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {filteredBusRoutes.map((bus) => (
                    <Button
                      key={bus.id}
                      variant="outline"
                      className="justify-start h-auto p-3 bg-transparent"
                      onClick={() => handleBusSelect(bus)}
                    >
                      {bus.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Bus Reviews */}
      {selectedBusId && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">{selectedBusName}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {renderStars(Math.round(Number.parseFloat(averageRating)))}
                    <span className="text-sm text-muted-foreground">
                      {averageRating} ({filteredReviews.length} review{filteredReviews.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Write Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Write a Review for {selectedBusName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Rating</label>
                        {renderStars(newReview.rating, true, (rating) => setNewReview({ ...newReview, rating }))}
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Your Review</label>
                        <Textarea
                          placeholder="Share your experience with this bus route..."
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          rows={4}
                        />
                      </div>
                      <Button
                        onClick={handleSubmitReview}
                        disabled={newReview.rating === 0 || !newReview.comment.trim() || submittingReview}
                        className="w-full"
                      >
                        {submittingReview ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Review"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
          </Card>

          {/* Reviews List */}
          <div className="space-y-4">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{review.author}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <Badge variant="secondary">{review.rating}/5</Badge>
                        </div>
                        <p className="text-sm leading-relaxed">{review.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reviews yet for this route.</p>
                  <p className="text-sm text-muted-foreground mt-1">Be the first to share your experience!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* No Bus Selected State */}
      {!selectedBusId && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Search for a Bus Route</h3>
            <p className="text-muted-foreground">
              Use the search box above to find and select a bus route to view reviews
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
