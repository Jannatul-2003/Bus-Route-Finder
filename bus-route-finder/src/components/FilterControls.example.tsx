import * as React from "react"
import { FilterControls } from "./FilterControls"

/**
 * Example usage of FilterControls component
 * 
 * This example demonstrates:
 * - Basic usage with state management
 * - All filter and sort options
 * - Display of current filter state
 */
export function FilterControlsExample() {
  const [acFilter, setACFilter] = React.useState<boolean | null>(null)
  const [coachTypeFilter, setCoachTypeFilter] = React.useState<
    ("standard" | "express" | "luxury")[]
  >([])
  const [sortBy, setSortBy] = React.useState<
    "journeyLength" | "estimatedTime" | "name"
  >("journeyLength")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc")

  // Helper to display current filter state
  const getACFilterLabel = () => {
    if (acFilter === null) return "All buses"
    if (acFilter === true) return "AC only"
    return "Non-AC only"
  }

  const getCoachTypeLabel = () => {
    if (coachTypeFilter.length === 0) return "All types"
    return coachTypeFilter.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")
  }

  const getSortLabel = () => {
    const sortLabels = {
      journeyLength: "Journey Length",
      estimatedTime: "Estimated Time",
      name: "Bus Name",
    }
    const orderLabel = sortOrder === "asc" ? "Ascending" : "Descending"
    return `${sortLabels[sortBy]} (${orderLabel})`
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">FilterControls Example</h2>
        <p className="text-muted-foreground">
          Interactive example showing all filter and sort options
        </p>
      </div>

      <FilterControls
        acFilter={acFilter}
        onACFilterChange={setACFilter}
        coachTypeFilter={coachTypeFilter}
        onCoachTypeFilterChange={setCoachTypeFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      {/* Display current state */}
      <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
        <h3 className="font-semibold text-sm">Current Filter State:</h3>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">AC Filter:</span>
            <span className="font-medium">{getACFilterLabel()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Coach Types:</span>
            <span className="font-medium">{getCoachTypeLabel()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Sort:</span>
            <span className="font-medium">{getSortLabel()}</span>
          </div>
        </div>
      </div>

      {/* Reset button */}
      <button
        onClick={() => {
          setACFilter(null)
          setCoachTypeFilter([])
          setSortBy("journeyLength")
          setSortOrder("asc")
        }}
        className="px-4 py-2 rounded-md border bg-background hover:bg-accent transition-colors"
      >
        Reset All Filters
      </button>
    </div>
  )
}

/**
 * Example with pre-applied filters
 */
export function FilterControlsPresetExample() {
  const [acFilter, setACFilter] = React.useState<boolean | null>(true)
  const [coachTypeFilter, setCoachTypeFilter] = React.useState<
    ("standard" | "express" | "luxury")[]
  >(["express", "luxury"])
  const [sortBy, setSortBy] = React.useState<
    "journeyLength" | "estimatedTime" | "name"
  >("estimatedTime")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc")

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Pre-applied Filters Example</h2>
        <p className="text-muted-foreground">
          Example with AC and Express/Luxury filters already applied
        </p>
      </div>

      <FilterControls
        acFilter={acFilter}
        onACFilterChange={setACFilter}
        coachTypeFilter={coachTypeFilter}
        onCoachTypeFilterChange={setCoachTypeFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />
    </div>
  )
}
