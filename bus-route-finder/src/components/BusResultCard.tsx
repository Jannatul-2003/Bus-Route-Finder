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
        "group relative rounded-lg border bg-card p-3 sm:p-4 shadow-sm transition-all duration-200",
        "hover:shadow-md hover:border-primary/30",
        className
      )}
    >
      {/* Header: Bus name and badges */}
      <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg leading-tight text-foreground mb-1.5 sm:mb-2">
            {bus.name}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
      </div>

      {/* Route visualization */}
      <div className="mb-2 sm:mb-3 py-2 sm:py-3 px-2 sm:px-3 bg-muted/30 rounded-md">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
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

      {/* Estimated time */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
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
          className="text-xs min-h-[44px] sm:min-h-auto"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
          </div>
        </div>
      )}

      {/* Select button (if onSelect provided) */}
      {onSelect && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
          <Button
            onClick={handleSelect}
            className="w-full min-h-[48px]"
            aria-label={`Select ${bus.name} route`}
          >
            Select Route
          </Button>
        </div>
      )}
    </div>
  )
}
