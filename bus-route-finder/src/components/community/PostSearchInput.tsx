import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { PostType, PostStatus } from "@/lib/types/community"

interface PostSearchInputProps {
  keyword: string
  postType: PostType | null
  status: PostStatus | 'all' | null
  onKeywordChange: (keyword: string) => void
  onPostTypeChange: (postType: PostType | null) => void
  onStatusChange: (status: PostStatus | 'all' | null) => void
  onClearFilters: () => void
  className?: string
  placeholder?: string
}

const POST_TYPE_OPTIONS: { value: PostType; label: string }[] = [
  { value: 'discussion', label: 'Discussion' },
  { value: 'lost_item', label: 'Lost Item' },
  { value: 'found_item', label: 'Found Item' },
  { value: 'delay_report', label: 'Delay Report' },
  { value: 'emergency', label: 'Emergency' }
]

const STATUS_OPTIONS: { value: PostStatus | 'all'; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All Status' }
]

export function PostSearchInput({
  keyword,
  postType,
  status,
  onKeywordChange,
  onPostTypeChange,
  onStatusChange,
  onClearFilters,
  className,
  placeholder = "Search posts by title or content..."
}: PostSearchInputProps) {
  const hasActiveFilters = keyword.trim() || postType || (status && status !== 'active' && status !== null)

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search Input */}
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          className="pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="h-4 w-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Post Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Type:</span>
          <Select
            value={postType || "all"}
            onValueChange={(value) => onPostTypeChange(value === "all" ? null : value as PostType)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {POST_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          <Select
            value={status || "active"}
            onValueChange={(value) => onStatusChange(value as PostStatus | 'all')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            onClick={onClearFilters}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Active filters:</span>
          
          {keyword.trim() && (
            <Badge variant="secondary" className="text-xs">
              Keyword: "{keyword.trim()}"
            </Badge>
          )}
          
          {postType && (
            <Badge variant="secondary" className="text-xs">
              Type: {POST_TYPE_OPTIONS.find(opt => opt.value === postType)?.label}
            </Badge>
          )}
          
          {status && status !== 'active' && status !== null && (
            <Badge variant="secondary" className="text-xs">
              Status: {STATUS_OPTIONS.find(opt => opt.value === status)?.label}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}