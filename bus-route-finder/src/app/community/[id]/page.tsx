"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { communityStore } from "@/lib/stores/communityStore"
import { PostCard } from "@/components/community/PostCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { PostType, PostStatus } from "@/lib/types/community"

export default function CommunityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const communityId = params.id as string
  
  const [state, setState] = React.useState(communityStore.getState())
  const [selectedType, setSelectedType] = React.useState<PostType | null>(null)
  const [selectedStatus, setSelectedStatus] = React.useState<PostStatus>('active')

  React.useEffect(() => {
    const observer = {
      update: (newState: typeof state) => setState(newState)
    }
    communityStore.subscribe(observer)
    return () => communityStore.unsubscribe(observer)
  }, [])

  React.useEffect(() => {
    if (communityId) {
      communityStore.fetchCommunityById(communityId)
      communityStore.fetchCommunityPosts(communityId, {
        postType: selectedType || undefined,
        status: selectedStatus
      })
      communityStore.fetchCommunityMembers(communityId)
    }
  }, [communityId, selectedType, selectedStatus])

  const handleCreatePost = () => {
    router.push(`/community/${communityId}/post/create`)
  }

  const handleViewPost = (postId: string) => {
    router.push(`/community/${communityId}/post/${postId}`)
  }

  const handleFilterType = (type: PostType | null) => {
    setSelectedType(type)
  }

  const handleFilterStatus = (status: PostStatus) => {
    setSelectedStatus(status)
  }

  if (!state.selectedCommunity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-muted-foreground">Loading community...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Community header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{state.selectedCommunity.name}</h1>
            {state.selectedCommunity.description && (
              <p className="text-muted-foreground">{state.selectedCommunity.description}</p>
            )}
          </div>
          <Button onClick={() => router.back()} variant="outline">
            Back
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <span className="flex items-center gap-2">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {state.selectedCommunity.member_count} members
          </span>
          <span className="flex items-center gap-2">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            {state.selectedCommunity.post_count} posts
          </span>
        </div>
      </div>

      {/* Filters and create button */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-2">
          <Badge
            variant={selectedType === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => handleFilterType(null)}
          >
            All
          </Badge>
          <Badge
            variant={selectedType === 'discussion' ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => handleFilterType('discussion')}
          >
            Discussions
          </Badge>
          <Badge
            variant={selectedType === 'lost_item' ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => handleFilterType('lost_item')}
          >
            Lost Items
          </Badge>
          <Badge
            variant={selectedType === 'found_item' ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => handleFilterType('found_item')}
          >
            Found Items
          </Badge>
          <Badge
            variant={selectedType === 'delay_report' ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => handleFilterType('delay_report')}
          >
            Delays
          </Badge>
        </div>

        <div className="flex gap-2 ml-auto">
          <Badge
            variant={selectedStatus === 'active' ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => handleFilterStatus('active')}
          >
            Active
          </Badge>
          <Badge
            variant={selectedStatus === 'resolved' ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => handleFilterStatus('resolved')}
          >
            Resolved
          </Badge>
        </div>

        <Button onClick={handleCreatePost}>
          Create Post
        </Button>
      </div>

      {/* Posts */}
      {state.loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      ) : state.posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No posts yet</p>
          <Button onClick={handleCreatePost}>Create the first post</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {state.posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onView={handleViewPost}
            />
          ))}
        </div>
      )}
    </div>
  )
}
