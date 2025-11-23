# FilterControls Component

A modern, accessible component for filtering and sorting bus search results.

## Features

- **AC/Non-AC Filter**: Toggle buttons to filter buses by air conditioning
- **Coach Type Filter**: Multi-select buttons for Standard, Express, and Luxury coaches
- **Sort Dropdown**: Select sort criteria (Journey Length, Estimated Time, Bus Name)
- **Sort Order Toggle**: Switch between ascending and descending order
- **Keyboard Navigation**: Full keyboard support for accessibility
- **Modern Design**: Active states, smooth transitions, and visual feedback

## Props

```typescript
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
```

## Usage

```tsx
import { FilterControls } from "@/components/FilterControls"

function BusSearchPage() {
  const [acFilter, setACFilter] = useState<boolean | null>(null)
  const [coachTypeFilter, setCoachTypeFilter] = useState<("standard" | "express" | "luxury")[]>([])
  const [sortBy, setSortBy] = useState<"journeyLength" | "estimatedTime" | "name">("journeyLength")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  return (
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
  )
}
```

## Integration with RoutePlannerStore

```tsx
import { FilterControls } from "@/components/FilterControls"
import { routePlannerStore } from "@/lib/stores/routePlannerStore"

function BusSearchPage() {
  const state = routePlannerStore.getState()

  return (
    <FilterControls
      acFilter={state.filters.isAC}
      onACFilterChange={(filter) => routePlannerStore.setACFilter(filter)}
      coachTypeFilter={state.filters.coachTypes}
      onCoachTypeFilterChange={(types) => routePlannerStore.setCoachTypeFilter(types)}
      sortBy={state.sortBy}
      onSortByChange={(sortBy) => routePlannerStore.setSortBy(sortBy)}
      sortOrder={state.sortOrder}
      onSortOrderChange={(order) => routePlannerStore.setSortOrder(order)}
    />
  )
}
```

## Accessibility

- All buttons have proper `aria-label` and `aria-pressed` attributes
- Filter groups have `role="group"` and `aria-label` for screen readers
- Sort dropdown uses semantic select component with keyboard navigation
- Focus indicators for keyboard navigation
- Clear visual feedback for active states

## Requirements

Implements the following requirements:
- **Requirement 6.1**: Provides filter controls for AC/non-AC and coach type
- **Requirement 6.6**: Provides sort option to order buses

## Design Patterns

- Uses controlled component pattern for all state
- Follows existing component styling conventions
- Implements toggle behavior for filters (click to activate, click again to deactivate)
- Multi-select behavior for coach types (can select multiple simultaneously)
