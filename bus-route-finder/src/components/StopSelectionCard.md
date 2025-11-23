# StopSelectionCard Component

A modern, accessible card component for selecting bus stops with visual distance indicators.

## Features

- **Color-coded distance badges**: Visual feedback based on walking distance
  - 🟢 Green: < 300m (close)
  - 🟡 Yellow: 300-600m (medium)
  - 🟠 Orange: > 600m (far)
- **Smart distance formatting**: Meters for short distances, kilometers for longer ones
- **Accessibility indicators**: Shows wheelchair accessibility status
- **Distance method indicator**: Subtle indicator for approximate (Haversine) vs accurate (OSRM) distances
- **Smooth animations**: Hover effects, selection transitions, and micro-interactions
- **Full keyboard support**: Tab navigation, Enter/Space to select
- **ARIA compliant**: Proper roles, labels, and states for screen readers

## Usage

```tsx
import { StopSelectionCard } from "@/components/StopSelectionCard"
import type { StopWithDistance } from "@/lib/types/database"

function MyComponent() {
  const [selectedStop, setSelectedStop] = React.useState<StopWithDistance | null>(null)

  const stop: StopWithDistance = {
    id: "stop-1",
    name: "Mohakhali Bus Stop",
    latitude: 23.7808,
    longitude: 90.4067,
    accessible: true,
    created_at: "2024-01-01T00:00:00Z",
    distance: 250,
    distanceMethod: "OSRM",
  }

  return (
    <StopSelectionCard
      stop={stop}
      isSelected={selectedStop?.id === stop.id}
      onSelect={setSelectedStop}
      selectionMode="radio"
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `stop` | `StopWithDistance` | Required | The stop data to display |
| `isSelected` | `boolean` | Required | Whether this stop is currently selected |
| `onSelect` | `(stop: StopWithDistance) => void` | Required | Callback when stop is selected |
| `selectionMode` | `"radio" \| "checkbox"` | `"radio"` | Visual style of selection indicator |
| `className` | `string` | `undefined` | Additional CSS classes |

## StopWithDistance Interface

```typescript
interface StopWithDistance {
  id: string
  name: string
  latitude: number
  longitude: number
  accessible: boolean
  created_at: string
  distance: number // in meters
  distanceMethod: 'OSRM' | 'Haversine'
}
```

## Distance Badge Colors

The component automatically applies color coding based on walking distance:

- **Green** (`< 300m`): Very close, comfortable walking distance
- **Yellow** (`300m - 600m`): Moderate walking distance
- **Orange** (`> 600m`): Longer walking distance

## Accessibility Features

- **Semantic HTML**: Uses proper ARIA roles (`radio` or `checkbox`)
- **Keyboard navigation**: Fully navigable with Tab, Enter, and Space keys
- **Screen reader support**: Descriptive `aria-label` includes stop name and distance
- **Focus indicators**: Clear visual focus states for keyboard users
- **State communication**: `aria-checked` attribute reflects selection state

## Design Principles

- **Modern aesthetics**: Rounded corners, subtle shadows, smooth transitions
- **Visual hierarchy**: Stop name prominent, distance badge eye-catching
- **Interactive feedback**: Hover effects, scale animations, color changes
- **Responsive**: Works on all screen sizes
- **Dark mode**: Fully supports dark mode with appropriate color adjustments

## Examples

See `StopSelectionCard.example.tsx` for interactive examples demonstrating:
- Radio selection mode
- Multiple stops with different distances
- Accessible and non-accessible stops
- OSRM vs Haversine distance methods
- Keyboard navigation
- Selection state management

## Requirements Validation

This component validates the following requirements:

- **3.1**: Displays stops in separate sections (starting/destination)
- **3.2**: Shows stop name and calculated distance from reference location
- **3.3**: Highlights selection and enables further interactions
