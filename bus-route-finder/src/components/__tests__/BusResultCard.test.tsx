import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BusResultCard } from "../BusResultCard"
import type { EnhancedBusResult } from "@/lib/decorators/BusResult"

describe("BusResultCard", () => {
  const mockBus: EnhancedBusResult = {
    id: "bus-1",
    name: "Bus #42",
    isAC: true,
    coachType: "express",
    onboardingStop: {
      id: "stop-1",
      name: "Gulshan Circle 1",
      latitude: 23.7808,
      longitude: 90.4172,
    },
    offboardingStop: {
      id: "stop-2",
      name: "Motijheel",
      latitude: 23.7334,
      longitude: 90.4182,
    },
    journeyLength: 2.5,
    walkingDistanceToOnboarding: 0.25,
    walkingDistanceFromOffboarding: 0.42,
    totalWalkingDistance: 0.67,
    totalDistance: 3.17,
    estimatedJourneyTime: 15,
    estimatedWalkingTime: 8,
    estimatedTotalTime: 23,
  }

  it("renders bus name", () => {
    render(<BusResultCard bus={mockBus} />)
    expect(screen.getByText("Bus #42")).toBeTruthy()
  })

  it("displays AC badge for AC buses", () => {
    render(<BusResultCard bus={mockBus} />)
    expect(screen.getByText("AC")).toBeTruthy()
  })

  it("displays Non-AC badge for non-AC buses", () => {
    const nonACBus = { ...mockBus, isAC: false }
    render(<BusResultCard bus={nonACBus} />)
    expect(screen.getByText("Non-AC")).toBeTruthy()
  })

  it("displays coach type badge", () => {
    render(<BusResultCard bus={mockBus} />)
    expect(screen.getByText("Express")).toBeTruthy()
  })

  it("displays journey length prominently", () => {
    render(<BusResultCard bus={mockBus} />)
    // Journey length is 2.5 km = 2500m, should display as "2.50km"
    // Use getAllByText since it appears twice (in header and in ride section)
    const elements = screen.getAllByText("2.50km")
    expect(elements.length).toBeGreaterThan(0)
  })

  it("displays onboarding and offboarding stop names", () => {
    render(<BusResultCard bus={mockBus} />)
    expect(screen.getByText("Gulshan Circle 1")).toBeTruthy()
    expect(screen.getByText("Motijheel")).toBeTruthy()
  })

  it("displays walking distances", () => {
    render(<BusResultCard bus={mockBus} />)
    // Walking distances should be displayed in meters
    const walkElements = screen.getAllByText(/Walk:/)
    expect(walkElements).toHaveLength(2)
  })

  it("displays estimated total time", () => {
    render(<BusResultCard bus={mockBus} />)
    expect(screen.getByText("23 min")).toBeTruthy()
  })

  it("formats distances in meters when less than 1000m", () => {
    const shortDistanceBus = {
      ...mockBus,
      walkingDistanceToOnboarding: 0.25, // 250m
    }
    render(<BusResultCard bus={shortDistanceBus} />)
    expect(screen.getByText("250m")).toBeTruthy()
  })

  it("formats distances in kilometers when 1000m or more", () => {
    const longDistanceBus = {
      ...mockBus,
      journeyLength: 2.5, // 2500m = 2.50km
    }
    render(<BusResultCard bus={longDistanceBus} />)
    const elements = screen.getAllByText("2.50km")
    expect(elements.length).toBeGreaterThan(0)
  })

  it("formats time in minutes when less than 60 minutes", () => {
    render(<BusResultCard bus={mockBus} />)
    expect(screen.getByText("23 min")).toBeTruthy()
  })

  it("formats time in hours and minutes when 60 minutes or more", () => {
    const longTimeBus = {
      ...mockBus,
      estimatedTotalTime: 90, // 1h 30m
    }
    render(<BusResultCard bus={longTimeBus} />)
    expect(screen.getByText("1h 30m")).toBeTruthy()
  })

  it("expands details section when Details button is clicked", async () => {
    const user = userEvent.setup()
    render(<BusResultCard bus={mockBus} />)

    // Initially, expanded details should not be visible
    expect(screen.queryByText("Journey Time:")).toBeNull()

    // Click the Details button
    const detailsButton = screen.getByRole("button", { name: /show details/i })
    await user.click(detailsButton)

    // Now expanded details should be visible
    expect(screen.getByText("Journey Time:")).toBeTruthy()
    expect(screen.getByText("Walking Time:")).toBeTruthy()
  })

  it("collapses details section when Less button is clicked", async () => {
    const user = userEvent.setup()
    render(<BusResultCard bus={mockBus} />)

    // Expand details
    const detailsButton = screen.getByRole("button", { name: /show details/i })
    await user.click(detailsButton)
    expect(screen.getByText("Journey Time:")).toBeTruthy()

    // Collapse details
    const lessButton = screen.getByRole("button", { name: /hide details/i })
    await user.click(lessButton)
    expect(screen.queryByText("Journey Time:")).toBeNull()
  })

  it("displays Select Route button when onSelect is provided", () => {
    const onSelect = vi.fn()
    render(<BusResultCard bus={mockBus} onSelect={onSelect} />)
    expect(
      screen.getByRole("button", { name: /select bus #42 route/i })
    ).toBeTruthy()
  })

  it("does not display Select Route button when onSelect is not provided", () => {
    render(<BusResultCard bus={mockBus} />)
    expect(
      screen.queryByRole("button", { name: /select/i })
    ).toBeNull()
  })

  it("calls onSelect when Select Route button is clicked", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<BusResultCard bus={mockBus} onSelect={onSelect} />)

    const selectButton = screen.getByRole("button", {
      name: /select bus #42 route/i,
    })
    await user.click(selectButton)

    expect(onSelect).toHaveBeenCalledWith(mockBus)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it("displays correct badge styling for standard coach type", () => {
    const standardBus = { ...mockBus, coachType: "standard" as const }
    render(<BusResultCard bus={standardBus} />)
    expect(screen.getByText("Standard")).toBeTruthy()
  })

  it("displays correct badge styling for luxury coach type", () => {
    const luxuryBus = { ...mockBus, coachType: "luxury" as const }
    render(<BusResultCard bus={luxuryBus} />)
    expect(screen.getByText("Luxury")).toBeTruthy()
  })

  it("applies custom className when provided", () => {
    const { container } = render(
      <BusResultCard bus={mockBus} className="custom-class" />
    )
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain("custom-class")
  })

  it("has proper ARIA labels for accessibility", () => {
    render(<BusResultCard bus={mockBus} />)

    // Check for ARIA labels
    expect(screen.getByLabelText(/air conditioned/i)).toBeTruthy()
    expect(screen.getByLabelText(/express coach/i)).toBeTruthy()
    expect(
      screen.getByLabelText(/journey length: 2.50km/i)
    ).toBeTruthy()
  })

  it("displays all required information in expanded details", async () => {
    const user = userEvent.setup()
    render(<BusResultCard bus={mockBus} />)

    // Expand details
    const detailsButton = screen.getByRole("button", { name: /show details/i })
    await user.click(detailsButton)

    // Check all expanded details are present
    expect(screen.getByText("Journey Time:")).toBeTruthy()
    expect(screen.getByText("Walking Time:")).toBeTruthy()
    expect(screen.getByText("Total Distance:")).toBeTruthy()
    expect(screen.getByText("Walking Distance:")).toBeTruthy()
  })
})
