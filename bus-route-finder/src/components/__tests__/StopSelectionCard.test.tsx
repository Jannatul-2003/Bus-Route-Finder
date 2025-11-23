import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StopSelectionCard } from "../StopSelectionCard"
import type { StopWithDistance } from "@/lib/types/database"

describe("StopSelectionCard", () => {
  const mockStop: StopWithDistance = {
    id: "stop-1",
    name: "Mohakhali Bus Stop",
    latitude: 23.7808,
    longitude: 90.4067,
    accessible: true,
    created_at: "2024-01-01T00:00:00Z",
    distance: 250,
    distanceMethod: "OSRM",
  }

  it("renders stop name and distance", () => {
    const onSelect = vi.fn()
    render(
      <StopSelectionCard
        stop={mockStop}
        isSelected={false}
        onSelect={onSelect}
      />
    )

    expect(screen.getByText("Mohakhali Bus Stop")).toBeTruthy()
    expect(screen.getByText("250m")).toBeTruthy()
  })

  it("displays distance in meters when less than 1000m", () => {
    const onSelect = vi.fn()
    const stop = { ...mockStop, distance: 450 }
    render(
      <StopSelectionCard stop={stop} isSelected={false} onSelect={onSelect} />
    )

    expect(screen.getByText("450m")).toBeTruthy()
  })

  it("displays distance in kilometers when 1000m or more", () => {
    const onSelect = vi.fn()
    const stop = { ...mockStop, distance: 1500 }
    render(
      <StopSelectionCard stop={stop} isSelected={false} onSelect={onSelect} />
    )

    expect(screen.getByText("1.50km")).toBeTruthy()
  })

  it("shows accessible indicator when stop is accessible", () => {
    const onSelect = vi.fn()
    render(
      <StopSelectionCard
        stop={mockStop}
        isSelected={false}
        onSelect={onSelect}
      />
    )

    expect(screen.getByText("Accessible")).toBeTruthy()
  })

  it("does not show accessible indicator when stop is not accessible", () => {
    const onSelect = vi.fn()
    const stop = { ...mockStop, accessible: false }
    render(
      <StopSelectionCard stop={stop} isSelected={false} onSelect={onSelect} />
    )

    expect(screen.queryByText("Accessible")).toBeNull()
  })

  it("calls onSelect when clicked", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <StopSelectionCard
        stop={mockStop}
        isSelected={false}
        onSelect={onSelect}
      />
    )

    const card = screen.getByRole("radio")
    await user.click(card)

    expect(onSelect).toHaveBeenCalledWith(mockStop)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it("calls onSelect when Enter key is pressed", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <StopSelectionCard
        stop={mockStop}
        isSelected={false}
        onSelect={onSelect}
      />
    )

    const card = screen.getByRole("radio")
    card.focus()
    await user.keyboard("{Enter}")

    expect(onSelect).toHaveBeenCalledWith(mockStop)
  })

  it("calls onSelect when Space key is pressed", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <StopSelectionCard
        stop={mockStop}
        isSelected={false}
        onSelect={onSelect}
      />
    )

    const card = screen.getByRole("radio")
    card.focus()
    await user.keyboard(" ")

    expect(onSelect).toHaveBeenCalledWith(mockStop)
  })

  it("renders with radio role by default", () => {
    const onSelect = vi.fn()
    render(
      <StopSelectionCard
        stop={mockStop}
        isSelected={false}
        onSelect={onSelect}
      />
    )

    expect(screen.getByRole("radio")).toBeTruthy()
  })

  it("renders with checkbox role when selectionMode is checkbox", () => {
    const onSelect = vi.fn()
    render(
      <StopSelectionCard
        stop={mockStop}
        isSelected={false}
        onSelect={onSelect}
        selectionMode="checkbox"
      />
    )

    expect(screen.getByRole("checkbox")).toBeTruthy()
  })

  it("has correct aria-checked attribute when selected", () => {
    const onSelect = vi.fn()
    render(
      <StopSelectionCard
        stop={mockStop}
        isSelected={true}
        onSelect={onSelect}
      />
    )

    const card = screen.getByRole("radio")
    expect(card.getAttribute("aria-checked")).toBe("true")
  })

  it("has correct aria-checked attribute when not selected", () => {
    const onSelect = vi.fn()
    render(
      <StopSelectionCard
        stop={mockStop}
        isSelected={false}
        onSelect={onSelect}
      />
    )

    const card = screen.getByRole("radio")
    expect(card.getAttribute("aria-checked")).toBe("false")
  })

  it("has descriptive aria-label", () => {
    const onSelect = vi.fn()
    render(
      <StopSelectionCard
        stop={mockStop}
        isSelected={false}
        onSelect={onSelect}
      />
    )

    const card = screen.getByRole("radio")
    expect(card.getAttribute("aria-label")).toBe(
      "Mohakhali Bus Stop, 250m away"
    )
  })

  it("shows indicator for Haversine distance method", () => {
    const onSelect = vi.fn()
    const stop = { ...mockStop, distanceMethod: "Haversine" as const }
    render(
      <StopSelectionCard stop={stop} isSelected={false} onSelect={onSelect} />
    )

    const indicator = screen.getByLabelText(
      "Distance calculated using approximate method"
    )
    expect(indicator).toBeTruthy()
  })

  it("does not show indicator for OSRM distance method", () => {
    const onSelect = vi.fn()
    render(
      <StopSelectionCard
        stop={mockStop}
        isSelected={false}
        onSelect={onSelect}
      />
    )

    const indicator = screen.queryByLabelText(
      "Distance calculated using approximate method"
    )
    expect(indicator).toBeNull()
  })

  describe("Distance badge color coding", () => {
    it("applies green color for distances < 300m", () => {
      const onSelect = vi.fn()
      const stop = { ...mockStop, distance: 250 }
      render(
        <StopSelectionCard
          stop={stop}
          isSelected={false}
          onSelect={onSelect}
        />
      )

      const badge = screen.getByText("250m")
      expect(badge.classList.contains("bg-green-500/10")).toBe(true)
    })

    it("applies yellow color for distances between 300m and 600m", () => {
      const onSelect = vi.fn()
      const stop = { ...mockStop, distance: 450 }
      render(
        <StopSelectionCard
          stop={stop}
          isSelected={false}
          onSelect={onSelect}
        />
      )

      const badge = screen.getByText("450m")
      expect(badge.classList.contains("bg-yellow-500/10")).toBe(true)
    })

    it("applies orange color for distances > 600m", () => {
      const onSelect = vi.fn()
      const stop = { ...mockStop, distance: 750 }
      render(
        <StopSelectionCard
          stop={stop}
          isSelected={false}
          onSelect={onSelect}
        />
      )

      const badge = screen.getByText("750m")
      expect(badge.classList.contains("bg-orange-500/10")).toBe(true)
    })
  })
})
