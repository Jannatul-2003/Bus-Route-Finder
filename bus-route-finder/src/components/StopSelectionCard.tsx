import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { StopWithDistance } from "@/lib/types/database"

interface StopSelectionCardProps {
  stop: StopWithDistance
  isSelected: boolean
  onSelect: (stop: StopWithDistance) => void
  selectionMode?: "radio" | "checkbox"
  className?: string
}

/**
 * Get distance badge color based on distance thresholds
 * - Green: < 300m
 * - Yellow: 300m - 600m
 * - Orange: > 600m
 */
function getDistanceBadgeColor(distance: number): string {
  if (distance < 300) {
    return "bg-green-500/10 text-green-700 border-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30"
  } else if (distance < 600) {
    return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30"
  } else {
    return "bg-orange-500/10 text-orange-700 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30"
  }
}

/**
 * Format distance for display
 * - Meters if < 1000m
 * - Kilometers with 2 decimal places if >= 1000m
 */
function formatDistance(distance: number): string {
  if (distance < 1000) {
    return `${Math.round(distance)}m`
  } else {
    return `${(distance / 1000).toFixed(2)}km`
  }
}

export function StopSelectionCard({
  stop,
  isSelected,
  onSelect,
  selectionMode = "radio",
  className,
}: StopSelectionCardProps) {
  const handleClick = () => {
    onSelect(stop)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onSelect(stop)
    }
  }

  const distanceBadgeColor = getDistanceBadgeColor(stop.distance)
  const formattedDistance = formatDistance(stop.distance)

  return (
    <div
      role={selectionMode === "radio" ? "radio" : "checkbox"}
      aria-checked={isSelected}
      aria-label={`${stop.name}, ${formattedDistance} away`}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-all duration-200",
        "hover:border-primary/50 hover:shadow-md hover:scale-[1.02]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isSelected &&
          "border-primary bg-primary/5 shadow-sm dark:bg-primary/10",
        !isSelected && "bg-card hover:bg-accent/50",
        className
      )}
    >
      {/* Selection indicator (checkbox/radio) */}
      <div
        className={cn(
          "flex items-center justify-center size-5 rounded-full border-2 transition-all duration-200 shrink-0",
          selectionMode === "radio" && "rounded-full",
          selectionMode === "checkbox" && "rounded",
          isSelected
            ? "border-primary bg-primary"
            : "border-muted-foreground/30 group-hover:border-primary/50"
        )}
        aria-hidden="true"
      >
        {isSelected && (
          <svg
            className="size-3 text-primary-foreground animate-in zoom-in duration-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>

      {/* Stop information */}
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            "font-medium text-sm leading-tight transition-colors duration-200",
            isSelected ? "text-foreground" : "text-foreground/90"
          )}
        >
          {stop.name}
        </h3>
        {stop.accessible && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <svg
              className="size-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Accessible
          </p>
        )}
      </div>

      {/* Distance badge */}
      <Badge
        variant="outline"
        className={cn(
          "shrink-0 font-semibold transition-all duration-200",
          distanceBadgeColor
        )}
      >
        {formattedDistance}
      </Badge>

      {/* Distance method indicator (subtle) */}
      {stop.distanceMethod === "Haversine" && (
        <div
          className="absolute top-1 right-1 size-2 rounded-full bg-yellow-500/50"
          title="Approximate distance (straight-line)"
          aria-label="Distance calculated using approximate method"
        />
      )}
    </div>
  )
}
