import * as React from "react"
import { StopSelectionCard } from "./StopSelectionCard"
import type { StopWithDistance } from "@/lib/types/database"

export default function StopSelectionCardExample() {
  const [selectedStopId, setSelectedStopId] = React.useState<string | null>(
    null
  )

  const stops: StopWithDistance[] = [
    {
      id: "stop-1",
      name: "Mohakhali Bus Stop",
      latitude: 23.7808,
      longitude: 90.4067,
      accessible: true,
      created_at: "2024-01-01T00:00:00Z",
      distance: 250,
      distanceMethod: "OSRM",
    },
    {
      id: "stop-2",
      name: "Banani Bus Stand",
      latitude: 23.7937,
      longitude: 90.4066,
      accessible: false,
      created_at: "2024-01-01T00:00:00Z",
      distance: 450,
      distanceMethod: "OSRM",
    },
    {
      id: "stop-3",
      name: "Gulshan Circle 1",
      latitude: 23.7808,
      longitude: 90.4178,
      accessible: true,
      created_at: "2024-01-01T00:00:00Z",
      distance: 750,
      distanceMethod: "Haversine",
    },
    {
      id: "stop-4",
      name: "Farmgate Bus Terminal",
      latitude: 23.7563,
      longitude: 90.3897,
      accessible: true,
      created_at: "2024-01-01T00:00:00Z",
      distance: 1500,
      distanceMethod: "OSRM",
    },
  ]

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">StopSelectionCard Examples</h1>
        <p className="text-muted-foreground">
          Interactive cards for selecting bus stops with distance indicators
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Radio Selection Mode</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Select one stop from the list. Notice the color-coded distance
          badges:
          <br />
          🟢 Green (&lt; 300m) | 🟡 Yellow (300-600m) | 🟠 Orange (&gt; 600m)
        </p>
        <div className="space-y-3">
          {stops.map((stop) => (
            <StopSelectionCard
              key={stop.id}
              stop={stop}
              isSelected={selectedStopId === stop.id}
              onSelect={(stop) => setSelectedStopId(stop.id)}
              selectionMode="radio"
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Selected Stop Details</h2>
        {selectedStopId ? (
          <div className="p-4 rounded-lg border bg-card">
            <pre className="text-sm">
              {JSON.stringify(
                stops.find((s) => s.id === selectedStopId),
                null,
                2
              )}
            </pre>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No stop selected. Click on a card above to select.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Features Demonstrated</h2>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          <li>
            <strong>Color-coded distance badges:</strong> Green for close stops
            (&lt;300m), yellow for medium distance (300-600m), orange for far
            stops (&gt;600m)
          </li>
          <li>
            <strong>Distance formatting:</strong> Meters for distances &lt;
            1000m, kilometers with 2 decimals for longer distances
          </li>
          <li>
            <strong>Accessibility indicator:</strong> Shows when a stop is
            wheelchair accessible
          </li>
          <li>
            <strong>Distance method indicator:</strong> Small yellow dot for
            approximate (Haversine) distances
          </li>
          <li>
            <strong>Hover effects:</strong> Cards scale slightly and show shadow
            on hover
          </li>
          <li>
            <strong>Selection state:</strong> Selected cards have primary border
            and background tint
          </li>
          <li>
            <strong>Keyboard navigation:</strong> Use Tab to focus, Enter or
            Space to select
          </li>
          <li>
            <strong>ARIA labels:</strong> Screen reader friendly with
            descriptive labels
          </li>
        </ul>
      </div>
    </div>
  )
}
