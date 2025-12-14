"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { communityStore } from "@/lib/stores/communityStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import type { PostType, ItemCategory } from "@/lib/types/community"

export default function CreatePostPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const communityId = params.id as string
  
  const [community, setCommunity] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = React.useState({
    post_type: '' as PostType | '',
    title: '',
    content: '',
    item_category: '' as ItemCategory | '',
    item_description: '',
    photo_url: '',
    location_latitude: null as number | null,
    location_longitude: null as number | null,
    bus_id: ''
  })
  
  // Form validation errors
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    const loadCommunityData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Validate user is logged in
        if (!user) {
          setError("You must be logged in to create posts")
          return
        }

        // Validate membership before allowing post creation
        const validation = await communityStore.validateMembershipForPostCreation(communityId, user.id)
        if (!validation.canCreate) {
          setError(validation.reason || 'Cannot create post')
          return
        }

        // Load community details
        await communityStore.fetchCommunityById(communityId)
        const communityData = communityStore.getState().selectedCommunity
        setCommunity(communityData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load community data")
      } finally {
        setLoading(false)
      }
    }

    if (communityId) {
      loadCommunityData()
    }
  }, [communityId, user])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    // Required field validation
    if (!formData.post_type) {
      errors.post_type = "Post type is required"
    }
    
    if (!formData.title.trim()) {
      errors.title = "Title is required"
    } else if (formData.title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters long"
    } else if (formData.title.trim().length > 200) {
      errors.title = "Title must be less than 200 characters"
    }
    
    if (!formData.content.trim()) {
      errors.content = "Content is required"
    } else if (formData.content.trim().length < 10) {
      errors.content = "Content must be at least 10 characters long"
    } else if (formData.content.trim().length > 5000) {
      errors.content = "Content must be less than 5000 characters"
    }
    
    // Post type specific validation
    if (formData.post_type === 'lost_item' || formData.post_type === 'found_item') {
      if (!formData.item_category) {
        errors.item_category = "Item category is required for lost/found items"
      }
      if (!formData.item_description?.trim()) {
        errors.item_description = "Item description is required for lost/found items"
      }
    }
    
    // URL validation for photo
    if (formData.photo_url && !isValidUrl(formData.photo_url)) {
      errors.photo_url = "Please enter a valid URL"
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      setSubmitting(true)
      setError(null)
      
      // Validate that user exists and post type is selected
      if (!user) {
        setError("User authentication required")
        return
      }
      
      if (!formData.post_type) {
        setError("Post type is required")
        return
      }

      // Create the post using the store
      const postData = {
        post_type: formData.post_type as PostType,
        title: formData.title.trim(),
        content: formData.content.trim(),
        item_category: formData.item_category || undefined,
        item_description: formData.item_description?.trim() || undefined,
        photo_url: formData.photo_url?.trim() || undefined,
        location_latitude: formData.location_latitude || undefined,
        location_longitude: formData.location_longitude || undefined,
        bus_id: formData.bus_id?.trim() || undefined
      }
      
      const newPost = await communityStore.createPost(communityId, postData, user.id)
      
      if (newPost) {
        // Navigate back to community page using slug-based URL
        if (community?.name) {
          const communitySlug = community.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim()
          router.push(`/community/c/${communitySlug}`)
        } else {
          // Fallback to community list if we can't generate slug
          router.push('/community')
        }
      } else {
        setError("Failed to create post")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Community not found</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          ← Back to {community.name}
        </Button>
        <h1 className="text-3xl font-bold">Create New Post</h1>
        <p className="text-muted-foreground mt-2">
          Share information, ask questions, or report lost items with the community
        </p>
      </div>

      {/* Post Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
          <CardDescription>
            Fill out the form below to create your post. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Post Type */}
            <div className="space-y-2">
              <Label htmlFor="post_type">Post Type *</Label>
              <Select 
                value={formData.post_type} 
                onValueChange={(value) => handleInputChange('post_type', value as PostType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select post type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discussion">Discussion</SelectItem>
                  <SelectItem value="lost_item">Lost Item</SelectItem>
                  <SelectItem value="found_item">Found Item</SelectItem>
                  <SelectItem value="delay_report">Delay Report</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.post_type && (
                <p className="text-sm text-red-600">{validationErrors.post_type}</p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter a descriptive title"
                maxLength={200}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{validationErrors.title && <span className="text-red-600">{validationErrors.title}</span>}</span>
                <span>{formData.title.length}/200</span>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Describe your post in detail..."
                rows={6}
                maxLength={5000}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{validationErrors.content && <span className="text-red-600">{validationErrors.content}</span>}</span>
                <span>{formData.content.length}/5000</span>
              </div>
            </div>

            {/* Item-specific fields for lost/found items */}
            {(formData.post_type === 'lost_item' || formData.post_type === 'found_item') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="item_category">Item Category *</Label>
                  <Select 
                    value={formData.item_category} 
                    onValueChange={(value) => handleInputChange('item_category', value as ItemCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                      <SelectItem value="bag">Bag</SelectItem>
                      <SelectItem value="keys">Keys</SelectItem>
                      <SelectItem value="documents">Documents</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.item_category && (
                    <p className="text-sm text-red-600">{validationErrors.item_category}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item_description">Item Description *</Label>
                  <Textarea
                    id="item_description"
                    value={formData.item_description}
                    onChange={(e) => handleInputChange('item_description', e.target.value)}
                    placeholder="Describe the item in detail (color, brand, distinctive features, etc.)"
                    rows={3}
                  />
                  {validationErrors.item_description && (
                    <p className="text-sm text-red-600">{validationErrors.item_description}</p>
                  )}
                </div>
              </>
            )}

            {/* Optional fields */}
            <div className="space-y-2">
              <Label htmlFor="photo_url">Photo URL (optional)</Label>
              <Input
                id="photo_url"
                type="url"
                value={formData.photo_url}
                onChange={(e) => handleInputChange('photo_url', e.target.value)}
                placeholder="https://example.com/photo.jpg"
              />
              {validationErrors.photo_url && (
                <p className="text-sm text-red-600">{validationErrors.photo_url}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bus_id">Bus ID (optional)</Label>
              <Input
                id="bus_id"
                value={formData.bus_id}
                onChange={(e) => handleInputChange('bus_id', e.target.value)}
                placeholder="Enter bus ID if relevant"
              />
            </div>

            {/* Submit buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Creating Post..." : "Create Post"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}