/**
 * ThresholdInput Component Usage Examples
 * 
 * This file demonstrates how to use the ThresholdInput component
 * in different scenarios.
 */

import * as React from "react"
import { ThresholdInput } from "./ThresholdInput"

// Example 1: Basic usage with starting location threshold
export function BasicThresholdExample() {
  const [threshold, setThreshold] = React.useState<number | null>(500)

  return (
    <ThresholdInput
      value={threshold}
      onChange={setThreshold}
      label="Starting Location Threshold"
    />
  )
}

// Example 2: Destination threshold with "no threshold" option
export function DestinationThresholdExample() {
  const [threshold, setThreshold] = React.useState<number | null>(500)

  return (
    <ThresholdInput
      value={threshold}
      onChange={setThreshold}
      label="Destination Threshold"
      allowNoThreshold={true}
    />
  )
}

// Example 3: With external error handling
export function ThresholdWithExternalValidation() {
  const [threshold, setThreshold] = React.useState<number | null>(500)
  const [externalError, setExternalError] = React.useState<string>("")

  const handleChange = (value: number | null) => {
    setThreshold(value)
    
    // Example: Custom validation logic
    if (value && value > 2000) {
      setExternalError("Warning: Large threshold may result in many stops")
    } else {
      setExternalError("")
    }
  }

  return (
    <ThresholdInput
      value={threshold}
      onChange={handleChange}
      label="Custom Validated Threshold"
      error={externalError}
    />
  )
}

// Example 4: Complete form with both thresholds
export function CompleteThresholdForm() {
  const [startingThreshold, setStartingThreshold] = React.useState<number | null>(500)
  const [destinationThreshold, setDestinationThreshold] = React.useState<number | null>(500)

  return (
    <div className="space-y-6">
      <ThresholdInput
        value={startingThreshold}
        onChange={setStartingThreshold}
        label="Starting Location Threshold"
      />
      
      <ThresholdInput
        value={destinationThreshold}
        onChange={setDestinationThreshold}
        label="Destination Threshold"
        allowNoThreshold={true}
      />

      <div className="mt-4 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Current Values:</h3>
        <p>Starting: {startingThreshold ?? "Not set"}m</p>
        <p>Destination: {destinationThreshold ?? "No threshold"}m</p>
      </div>
    </div>
  )
}
