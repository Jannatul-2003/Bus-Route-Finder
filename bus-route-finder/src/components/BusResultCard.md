# BusResultCard Component

A modern, feature-rich card component for displaying enhanced bus route results with journey information, walking distances, and time estimates.

## Features

- **Bus Information Display**: Shows bus name, AC/Non-AC status, and coach type (Standard/Express/Luxury)
- **Journey Length**: Prominently displays the journey length with an icon
- **Route Visualization**: Shows the route from onboarding to offboarding stop with arrows
- **Walking Distances**: Displays walking distances at both ends of the journey
- **Time Estimates**: Shows estimated total time including walking and journey time
- **Expandable Details**: Collapsible section with additional information
- **Modern Styling**: Card design with shadows, rounded corners, and smooth transitions
- **Accessibility**: Full ARIA labels and keyboard navigation support
- **Responsive**: Adapts to different screen sizes

## Usage

```tsx
import { BusResultCard } from "@/components/BusResultCard"
import type { EnhancedBusResult } from "@/lib/decorators/BusResult"

function BusResults() {
  const bus: EnhancedBusResult = {
    id: "1",
    name: "Bus #42",
    isAC: true,
    coachType: "express",
    onboardingStop: {
      id: "stop1",
      name: "Gulshan Circle 1",
      latitude: 23.7808,
      longitude: 90.4172,
    },
    offboardingStop: {
      id: "stop2",
      name: "Motijheel",
      latitude: 23.7334,
      longitude: 90.4182,
    },
    journeyLength: 2.5, // in kilometers
    walkingDistanceToOnboarding: 0.25, // in kilometers
    walkingDistanceFromOffboarding: 0.42, // in kilometers
    totalWalkingDistance: 0.67,
    totalDistance: 3.17,
    estimatedJourneyTime: 15, // in minutes
    estimatedWalkingTime: 8,
    estimatedTotalTime: 23,
  }

  const handleSelect = (selectedBus: EnhancedBusResult) => {
    console.log("Selected bus:", selectedBus.name)
  }

  return (
    <BusResultCard 
      bus={bus} 
      onSelect={handleSelect}
    />
  )
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `bus` | `EnhancedBusResult` | Yes | The enhanced bus result object with all computed properties |
| `onSelect` | `(bus: EnhancedBusResult) => void` | No | Callback function when the "Select Route" button is clicked |
| `className` | `string` | No | Additional CSS classes to apply to the card |

## EnhancedBusResult Interface

```typescript
interface EnhancedBusResult {
  id: string
  name: string
  isAC: boolean
  coachType: 'standard' | 'express' | 'luxury'
  onboardingStop: Stop
  offboardingStop: Stop
  journeyLength: number // in kilometers
  walkingDistanceToOnboarding: number // in kilometers
  walkingDistanceFromOffboarding: number // in kilometers
  totalWalkingDistance: number // in kilometers
  totalDistance: number // in kilometers
  estimatedJourneyTime: number // in minutes
  estimatedWalkingTime: number // in minutes
  estimatedTotalTime: number // in minutes
}

interface Stop {
  id: string
  name: string
  latitude: number
  longitude: number
}
```

## Features in Detail

### Badge System

- **AC Badge**: Blue badge with snowflake icon for AC buses, gray for Non-AC
- **Coach Type Badge**: 
  - Purple with lightning icon for Express
  - Amber with star icon for Luxury
  - Slate for Standard

### Distance Formatting

Distances are automatically formatted based on magnitude:
- Less than 1000m: Displayed in meters (e.g., "250m")
- 1000m or more: Displayed in kilometers with 2 decimal places (e.g., "2.50km")

### Time Formatting

Time estimates are formatted for readability:
- Less than 60 minutes: Displayed in minutes (e.g., "15 min")
- 60 minutes or more: Displayed in hours and minutes (e.g., "1h 30m")

### Expandable Details

The details section shows:
- Journey Time (bus ride only)
- Walking Time (total walking)
- Total Distance (walking + journey)
- Walking Distance (both ends combined)

### Accessibility

- Full ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader friendly
- Semantic HTML structure
- Focus indicators

## Styling

The component uses:
- Tailwind CSS for styling
- shadcn/ui components (Badge, Button)
- Dark mode support
- Smooth transitions and animations
- Responsive grid layouts

## Requirements Validation

This component satisfies the following requirements:

- **Requirement 4.4**: Displays all bus information including name, status, amenities, and coach type
- **Requirement 5.5**: Shows journey length in kilometers with two decimal precision
- **Requirement 9.4**: Displays walking distances in appropriate units (meters/kilometers)

## Design Patterns

The component follows these design principles:
- **Card-based layout**: Clean, contained design with shadow and border
- **Icon-driven UI**: Visual icons for quick recognition
- **Progressive disclosure**: Expandable details section for additional information
- **Responsive design**: Adapts to mobile and desktop viewports
