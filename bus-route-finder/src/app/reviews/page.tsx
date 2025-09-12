"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Star, Search, MessageSquare, User, Calendar } from "lucide-react"

// Mock data for bus routes and reviews
const busRoutes = [
  "Route 42 - Downtown Express",
  "Route 15 - University Line",
  "Express 7 - Airport Shuttle",
  "Route 23 - Mall Connector",
  "Route 8 - Hospital Route",
  "Route 101 - Suburban Loop",
  "Route 33 - Beach Line",
  "Route 55 - Industrial Zone",
]

const mockReviews = [
  {
    id: 1,
    busRoute: "Route 42 - Downtown Express",
    rating: 4,
    author: "Sarah M.",
    date: "2024-01-15",
    comment: "Very reliable service. Buses are usually on time and clean. The drivers are professional and courteous.",
  },
  {
    id: 2,
    busRoute: "Route 42 - Downtown Express",
    rating: 5,
    author: "Mike R.",
    date: "2024-01-10",
    comment: "Excellent route for commuting to downtown. Fast and efficient service with comfortable seating.",
  },
  {
    id: 3,
    busRoute: "Route 15 - University Line",
    rating: 3,
    author: "Emma L.",
    date: "2024-01-12",
    comment: "Good service but can get very crowded during peak hours. More frequent buses would help.",
  },
  {
    id: 4,
    busRoute: "Express 7 - Airport Shuttle",
    rating: 5,
    author: "David K.",
    date: "2024-01-08",
    comment: "Perfect for airport trips! Always on schedule and has luggage space. Highly recommended.",
  },
]

export default function BusReviews() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBus, setSelectedBus] = useState("")
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: "",
  })
  const [reviews, setReviews] = useState(mockReviews)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Filter bus routes based on search term
  const filteredBusRoutes = useMemo(() => {
    return busRoutes.filter((route) => route.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [searchTerm])

  // Filter reviews based on selected bus
  const filteredReviews = useMemo(() => {
    if (!selectedBus) return reviews
    return reviews.filter((review) => review.busRoute === selectedBus)
  }, [reviews, selectedBus])

  // Calculate average rating for selected bus
  const averageRating = useMemo(() => {
    if (filteredReviews.length === 0) return "0"
    const sum = filteredReviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / filteredReviews.length).toFixed(1)
  }, [filteredReviews])

  const handleBusSelect = (busRoute: string) => {
    setSelectedBus(busRoute)
    setSearchTerm("")
  }

  const handleSubmitReview = () => {
    if (selectedBus && newReview.rating > 0 && newReview.comment.trim()) {
      const review = {
        id: reviews.length + 1,
        busRoute: selectedBus,
        rating: newReview.rating,
        author: "You",
        date: new Date().toISOString().split("T")[0],
        comment: newReview.comment,
      }
      setReviews([review, ...reviews])
      setNewReview({ rating: 0, comment: "" })
      setIsDialogOpen(false)
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
                  {filteredBusRoutes.map((route) => (
                    <Button
                      key={route}
                      variant="outline"
                      className="justify-start h-auto p-3 bg-transparent"
                      onClick={() => handleBusSelect(route)}
                    >
                      {route}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Bus Reviews */}
      {selectedBus && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">{selectedBus}</CardTitle>
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
                      <DialogTitle>Write a Review for {selectedBus}</DialogTitle>
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
                        disabled={newReview.rating === 0 || !newReview.comment.trim()}
                        className="w-full"
                      >
                        Submit Review
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
                            <span className="text-sm text-muted-foreground">{review.date}</span>
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
      {!selectedBus && (
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
