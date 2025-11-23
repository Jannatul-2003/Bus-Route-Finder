import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FilterControlsProps {
  // AC Filter
  acFilter: boolean | null // null = no filter, true = AC only, false = non-AC only
  onACFilterChange: (filter: boolean | null) => void

  // Coach Type Filter
  coachTypeFilter: ("standard" | "express" | "luxury")[]
  onCoachTypeFilterChange: (types: ("standard" | "express" | "luxury")[]) => void

  // Sort Options
  sortBy: "journeyLength" | "estimatedTime" | "name"
  onSortByChange: (sortBy: "journeyLength" | "estimatedTime" | "name") => void

  sortOrder: "asc" | "desc"
  onSortOrderChange: (order: "asc" | "desc") => void

  className?: string
}

/**
 * FilterControls component provides filtering and sorting controls for bus results
 * 
 * Features:
 * - Toggle buttons for AC/Non-AC filtering
 * - Multi-select for coach types (Standard, Express, Luxury)
 * - Sort dropdown (Journey Length, Estimated Time, Name)
 * - Sort order toggle (Ascending/Descending)
 * - Keyboard navigation support
 * - Modern button design with active states
 * 
 * Requirements: 6.1, 6.6
 */
export function FilterControls({
  acFilter,
  onACFilterChange,
  coachTypeFilter,
  onCoachTypeFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  className,
}: FilterControlsProps) {
  // AC Filter handlers
  const handleACClick = () => {
    if (acFilter === true) {
      onACFilterChange(null) // Clear filter
    } else {
      onACFilterChange(true) // Set to AC only
    }
  }

  const handleNonACClick = () => {
    if (acFilter === false) {
      onACFilterChange(null) // Clear filter
    } else {
      onACFilterChange(false) // Set to non-AC only
    }
  }

  // Coach Type Filter handlers
  const handleCoachTypeToggle = (type: "standard" | "express" | "luxury") => {
    if (coachTypeFilter.includes(type)) {
      // Remove from filter
      onCoachTypeFilterChange(coachTypeFilter.filter((t) => t !== type))
    } else {
      // Add to filter
      onCoachTypeFilterChange([...coachTypeFilter, type])
    }
  }

  // Sort Order toggle
  const handleSortOrderToggle = () => {
    onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-4 rounded-lg border bg-card shadow-sm",
        className
      )}
      role="group"
      aria-label="Filter and sort controls"
    >
      {/* AC/Non-AC Filter */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          Air Conditioning
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="AC filter">
          <Button
            variant={acFilter === true ? "default" : "outline"}
            size="sm"
            onClick={handleACClick}
            aria-pressed={acFilter === true}
            aria-label="Filter by air conditioned buses"
            className={cn(
              "transition-all duration-200",
              acFilter === true && "shadow-md"
            )}
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
              />
            </svg>
            AC
          </Button>
          <Button
            variant={acFilter === false ? "default" : "outline"}
            size="sm"
            onClick={handleNonACClick}
            aria-pressed={acFilter === false}
            aria-label="Filter by non air conditioned buses"
            className={cn(
              "transition-all duration-200",
              acFilter === false && "shadow-md"
            )}
          >
            Non-AC
          </Button>
        </div>
      </div>

      {/* Coach Type Filter */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          Coach Type
        </label>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Coach type filter"
        >
          <Button
            variant={
              coachTypeFilter.includes("standard") ? "default" : "outline"
            }
            size="sm"
            onClick={() => handleCoachTypeToggle("standard")}
            aria-pressed={coachTypeFilter.includes("standard")}
            aria-label="Filter by standard coach"
            className={cn(
              "transition-all duration-200",
              coachTypeFilter.includes("standard") && "shadow-md"
            )}
          >
            Standard
          </Button>
          <Button
            variant={
              coachTypeFilter.includes("express") ? "default" : "outline"
            }
            size="sm"
            onClick={() => handleCoachTypeToggle("express")}
            aria-pressed={coachTypeFilter.includes("express")}
            aria-label="Filter by express coach"
            className={cn(
              "transition-all duration-200",
              coachTypeFilter.includes("express") && "shadow-md"
            )}
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Express
          </Button>
          <Button
            variant={
              coachTypeFilter.includes("luxury") ? "default" : "outline"
            }
            size="sm"
            onClick={() => handleCoachTypeToggle("luxury")}
            aria-pressed={coachTypeFilter.includes("luxury")}
            aria-label="Filter by luxury coach"
            className={cn(
              "transition-all duration-200",
              coachTypeFilter.includes("luxury") && "shadow-md"
            )}
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            Luxury
          </Button>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">
          Sort By
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger
              aria-label="Select sort criteria"
              className="w-[180px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="journeyLength">Journey Length</SelectItem>
              <SelectItem value="estimatedTime">Estimated Time</SelectItem>
              <SelectItem value="name">Bus Name</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSortOrderToggle}
            aria-label={`Sort order: ${sortOrder === "asc" ? "ascending" : "descending"}`}
            aria-pressed={sortOrder === "desc"}
            className="transition-all duration-200"
          >
            {sortOrder === "asc" ? (
              <>
                <svg
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                  />
                </svg>
                Ascending
              </>
            ) : (
              <>
                <svg
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                  />
                </svg>
                Descending
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
