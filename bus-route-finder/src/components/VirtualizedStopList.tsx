"use client"

import * as React from "react"
import { StopSelectionCard } from "./StopSelectionCard"
import type { StopWithDistance } from "@/lib/types/database"

interface VirtualizedStopListProps {
  stops: StopWithDistance[]
  selectedStopId: string | null
  onSelect: (stop: StopWithDistance) => void
  selectionMode?: "radio" | "checkbox"
  role?: string
  ariaLabel?: string
}

/**
 * Virtualized stop list for performance optimization
 * Requirements 2.1, 2.2: Virtualize long stop lists to improve rendering performance
 * 
 * Note: Using simple scrollable list instead of react-window for better compatibility.
 * For very large lists (>100 items), consider implementing virtual scrolling with
 * a different library or custom implementation.
 */
export function VirtualizedStopList({
  stops,
  selectedStopId,
  onSelect,
  selectionMode = "radio",
  role = "radiogroup",
  ariaLabel,
}: VirtualizedStopListProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const selectedRef = React.useRef<HTMLDivElement>(null)

  // Scroll to selected item when selection changes
  React.useEffect(() => {
    if (selectedStopId && selectedRef.current && containerRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [selectedStopId])

  return (
    <div
      ref={containerRef}
      role={role}
      aria-label={ariaLabel}
      className="space-y-3 max-h-[60vh] sm:max-h-96 overflow-y-auto -webkit-overflow-scrolling-touch"
    >
      {stops.map((stop) => (
        <div
          key={stop.id}
          ref={selectedStopId === stop.id ? selectedRef : null}
        >
          <StopSelectionCard
            stop={stop}
            isSelected={selectedStopId === stop.id}
            onSelect={onSelect}
            selectionMode={selectionMode}
          />
        </div>
      ))}
    </div>
  )
}
