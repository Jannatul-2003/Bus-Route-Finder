import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { EnhancedBusResult } from "@/lib/decorators/BusResult"

interface BusResultCardProps {
  bus: EnhancedBusResult
  onSelect?: (bus: EnhancedBusResult) => void
  className?: string
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

/**
 * Format time in minutes to human-readable format
 */
function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`
  } else {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
}

/**
 * Get badge styling for AC/Non-AC
 */
function getACBadgeStyle(isAC: boolean): string {
  if (isAC) {
    return "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30"
  } else {
    return "bg-gray-500/10 text-gray-700 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30"
  }
}

/**
 * Get badge styling for coach type
 */
function getCoachTypeBadgeStyle(coachType: string): string {
  switch (coachType) {
    case "express":
      return "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30"
    case "luxury":
      return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30"
    case "standard":
    default:
      return "bg-slate-500/10 text-slate-700 border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30"
  }
}

/**
 * Get display label for coach type
 */
function getCoachTypeLabel(coachType: string): string {
  return coachType.charAt(0).toUpperCase() + coachType.slice(1)
}

export function BusResultCard({
  bus,
  onSelect,
  className,
}: BusResultCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleSelect = () => {
    if (onSelect) {
      onSelect(bus)
    }
  }

  const acBadgeStyle = getACBadgeStyle(bus.isAC)
  const coachTypeBadgeStyle = getCoachTypeBadgeStyle(bus.coachType)
  const coachTypeLabel = getCoachTypeLabel(bus.coachType)

  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card p-4 shadow-sm transition-all duration-200",
        "hover:shadow-md hover:border-primary/30",
        className
      )}
    >
      {/* Header: Bus name and badges */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg leading-tight text-foreground mb-2">
            {bus.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn("font-medium", acBadgeStyle)}
              aria-label={bus.isAC ? "Air conditioned" : "Non air conditioned"}
            >
              {bus.isAC ? (
                <>
                  <svg
                    className="size-3"
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
                </>
              ) : (
                "Non-AC"
              )}
            </Badge>
            <Badge
              variant="outline"
              className={cn("font-medium", coachTypeBadgeStyle)}
              aria-label={`${coachTypeLabel} coach`}
            >
              {coachTypeLabel === "Express" && (
                <svg
                  className="size-3"
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
              )}
              {coachTypeLabel === "Luxury" && (
                <svg
                  className="size-3"
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
              )}
              {coachTypeLabel}
            </Badge>
          </div>
        </div>

        {/* Journey length prominently displayed */}
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1.5 text-primary font-bold text-xl">
            <svg
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <span aria-label={`Journey length: ${formatDistance(bus.journeyLength * 1000)}`}>
              {formatDistance(bus.journeyLength * 1000)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-0.5">
            journey
          </span>
        </div>
      </div>

      {/* Route visualization */}
      <div className="mb-3 py-3 px-3 bg-muted/30 rounded-md">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground shrink-0">
            {bus.onboardingStop.name}
          </span>
          <div className="flex-1 flex items-center gap-1 min-w-0">
            <div className="h-px bg-border flex-1" />
            <svg
              className="size-4 text-muted-foreground shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            <div className="h-px bg-border flex-1" />
          </div>
          <span className="font-medium text-foreground shrink-0">
            {bus.offboardingStop.name}
          </span>
        </div>
      </div>

      {/* Walking distances and time estimate */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        {/* Walking to onboarding */}
        <div className="flex items-center gap-2 text-sm">
          <svg
            className="size-4 text-muted-foreground shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-muted-foreground">Walk:</span>
          <span className="font-medium text-foreground">
            {formatDistance(bus.walkingDistanceToOnboarding * 1000)}
          </span>
        </div>

        {/* Bus ride */}
        <div className="flex items-center gap-2 text-sm">
          <svg
            className="size-4 text-muted-foreground shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
          <span className="text-muted-foreground">Ride:</span>
          <span className="font-medium text-foreground">
            {formatDistance(bus.journeyLength * 1000)}
          </span>
        </div>

        {/* Walking from offboarding */}
        <div className="flex items-center gap-2 text-sm">
          <svg
            className="size-4 text-muted-foreground shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-muted-foreground">Walk:</span>
          <span className="font-medium text-foreground">
            {formatDistance(bus.walkingDistanceFromOffboarding * 1000)}
          </span>
        </div>
      </div>

      {/* Estimated time */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <svg
            className="size-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-muted-foreground">Est. Time:</span>
          <span className="font-semibold text-foreground">
            {formatTime(bus.estimatedTotalTime)}
          </span>
        </div>

        {/* Expand/Collapse button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Hide details" : "Show details"}
          className="text-xs"
        >
          {isExpanded ? (
            <>
              Less
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
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </>
          ) : (
            <>
              Details
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </>
          )}
        </Button>
      </div>

      {/* Expandable details section */}
      {isExpanded && (
        <div
          className="pt-3 border-t space-y-2 animate-in slide-in-from-top-2 duration-200"
          role="region"
          aria-label="Additional bus details"
        >
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground block mb-1">
                Journey Time:
              </span>
              <span className="font-medium text-foreground">
                {formatTime(bus.estimatedJourneyTime)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">
                Walking Time:
              </span>
              <span className="font-medium text-foreground">
                {formatTime(bus.estimatedWalkingTime)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">
                Total Distance:
              </span>
              <span className="font-medium text-foreground">
                {formatDistance(bus.totalDistance * 1000)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-1">
                Walking Distance:
              </span>
              <span className="font-medium text-foreground">
                {formatDistance(bus.totalWalkingDistance * 1000)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Select button (if onSelect provided) */}
      {onSelect && (
        <div className="mt-3 pt-3 border-t">
          <Button
            onClick={handleSelect}
            className="w-full"
            aria-label={`Select ${bus.name} route`}
          >
            Select Route
          </Button>
        </div>
      )}
    </div>
  )
}
