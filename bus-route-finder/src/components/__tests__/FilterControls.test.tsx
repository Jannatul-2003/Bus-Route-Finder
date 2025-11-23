import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FilterControls } from "../FilterControls"

describe("FilterControls", () => {
  const defaultProps = {
    acFilter: null as boolean | null,
    onACFilterChange: vi.fn(),
    coachTypeFilter: [] as ("standard" | "express" | "luxury")[],
    onCoachTypeFilterChange: vi.fn(),
    sortBy: "journeyLength" as const,
    onSortByChange: vi.fn(),
    sortOrder: "asc" as const,
    onSortOrderChange: vi.fn(),
  }

  describe("AC Filter", () => {
    it("renders AC and Non-AC buttons", () => {
      render(<FilterControls {...defaultProps} />)

      expect(screen.getByRole("button", { name: /filter by air conditioned buses/i })).toBeTruthy()
      expect(screen.getByRole("button", { name: /filter by non air conditioned buses/i })).toBeTruthy()
    })

    it("calls onACFilterChange with true when AC button is clicked", async () => {
      const user = userEvent.setup()
      const onACFilterChange = vi.fn()

      render(<FilterControls {...defaultProps} onACFilterChange={onACFilterChange} />)

      const acButton = screen.getByRole("button", { name: /filter by air conditioned buses/i })
      await user.click(acButton)

      expect(onACFilterChange).toHaveBeenCalledWith(true)
    })

    it("calls onACFilterChange with false when Non-AC button is clicked", async () => {
      const user = userEvent.setup()
      const onACFilterChange = vi.fn()

      render(<FilterControls {...defaultProps} onACFilterChange={onACFilterChange} />)

      const nonACButton = screen.getByRole("button", { name: /filter by non air conditioned buses/i })
      await user.click(nonACButton)

      expect(onACFilterChange).toHaveBeenCalledWith(false)
    })

    it("calls onACFilterChange with null when active AC button is clicked again", async () => {
      const user = userEvent.setup()
      const onACFilterChange = vi.fn()

      render(<FilterControls {...defaultProps} acFilter={true} onACFilterChange={onACFilterChange} />)

      const acButton = screen.getByRole("button", { name: /filter by air conditioned buses/i })
      await user.click(acButton)

      expect(onACFilterChange).toHaveBeenCalledWith(null)
    })

    it("shows AC button as pressed when acFilter is true", () => {
      render(<FilterControls {...defaultProps} acFilter={true} />)

      const acButton = screen.getByRole("button", { name: /filter by air conditioned buses/i })
      expect(acButton.getAttribute("aria-pressed")).toBe("true")
    })

    it("shows Non-AC button as pressed when acFilter is false", () => {
      render(<FilterControls {...defaultProps} acFilter={false} />)

      const nonACButton = screen.getByRole("button", { name: /filter by non air conditioned buses/i })
      expect(nonACButton.getAttribute("aria-pressed")).toBe("true")
    })
  })

  describe("Coach Type Filter", () => {
    it("renders Standard, Express, and Luxury buttons", () => {
      render(<FilterControls {...defaultProps} />)

      expect(screen.getByRole("button", { name: /filter by standard coach/i })).toBeTruthy()
      expect(screen.getByRole("button", { name: /filter by express coach/i })).toBeTruthy()
      expect(screen.getByRole("button", { name: /filter by luxury coach/i })).toBeTruthy()
    })

    it("calls onCoachTypeFilterChange to add type when button is clicked", async () => {
      const user = userEvent.setup()
      const onCoachTypeFilterChange = vi.fn()

      render(<FilterControls {...defaultProps} onCoachTypeFilterChange={onCoachTypeFilterChange} />)

      const standardButton = screen.getByRole("button", { name: /filter by standard coach/i })
      await user.click(standardButton)

      expect(onCoachTypeFilterChange).toHaveBeenCalledWith(["standard"])
    })

    it("calls onCoachTypeFilterChange to remove type when active button is clicked", async () => {
      const user = userEvent.setup()
      const onCoachTypeFilterChange = vi.fn()

      render(
        <FilterControls
          {...defaultProps}
          coachTypeFilter={["standard", "express"]}
          onCoachTypeFilterChange={onCoachTypeFilterChange}
        />
      )

      const standardButton = screen.getByRole("button", { name: /filter by standard coach/i })
      await user.click(standardButton)

      expect(onCoachTypeFilterChange).toHaveBeenCalledWith(["express"])
    })

    it("shows buttons as pressed when types are in filter", () => {
      render(<FilterControls {...defaultProps} coachTypeFilter={["express", "luxury"]} />)

      const expressButton = screen.getByRole("button", { name: /filter by express coach/i })
      const luxuryButton = screen.getByRole("button", { name: /filter by luxury coach/i })
      const standardButton = screen.getByRole("button", { name: /filter by standard coach/i })

      expect(expressButton.getAttribute("aria-pressed")).toBe("true")
      expect(luxuryButton.getAttribute("aria-pressed")).toBe("true")
      expect(standardButton.getAttribute("aria-pressed")).toBe("false")
    })

    it("allows multiple coach types to be selected", async () => {
      const user = userEvent.setup()
      const onCoachTypeFilterChange = vi.fn()

      const { rerender } = render(<FilterControls {...defaultProps} onCoachTypeFilterChange={onCoachTypeFilterChange} />)

      const standardButton = screen.getByRole("button", { name: /filter by standard coach/i })
      await user.click(standardButton)

      expect(onCoachTypeFilterChange).toHaveBeenCalledWith(["standard"])

      // Simulate adding express to existing standard
      rerender(
        <FilterControls
          {...defaultProps}
          coachTypeFilter={["standard"]}
          onCoachTypeFilterChange={onCoachTypeFilterChange}
        />
      )

      const expressButton = screen.getByRole("button", { name: /filter by express coach/i })
      await user.click(expressButton)

      expect(onCoachTypeFilterChange).toHaveBeenCalledWith(["standard", "express"])
    })
  })

  describe("Sort Controls", () => {
    it("renders sort dropdown with correct value", () => {
      render(<FilterControls {...defaultProps} sortBy="journeyLength" />)

      const trigger = screen.getByRole("combobox", { name: /select sort criteria/i })
      expect(trigger).toBeTruthy()
    })

    it("renders sort order toggle button", () => {
      render(<FilterControls {...defaultProps} sortOrder="asc" />)

      const sortOrderButton = screen.getByRole("button", { name: /sort order: ascending/i })
      expect(sortOrderButton).toBeTruthy()
    })

    it("calls onSortOrderChange when sort order button is clicked", async () => {
      const user = userEvent.setup()
      const onSortOrderChange = vi.fn()

      render(<FilterControls {...defaultProps} onSortOrderChange={onSortOrderChange} />)

      const sortOrderButton = screen.getByRole("button", { name: /sort order: ascending/i })
      await user.click(sortOrderButton)

      expect(onSortOrderChange).toHaveBeenCalledWith("desc")
    })

    it("toggles sort order from desc to asc", async () => {
      const user = userEvent.setup()
      const onSortOrderChange = vi.fn()

      render(<FilterControls {...defaultProps} sortOrder="desc" onSortOrderChange={onSortOrderChange} />)

      const sortOrderButton = screen.getByRole("button", { name: /sort order: descending/i })
      await user.click(sortOrderButton)

      expect(onSortOrderChange).toHaveBeenCalledWith("asc")
    })

    it("displays correct icon for ascending order", () => {
      render(<FilterControls {...defaultProps} sortOrder="asc" />)

      const sortOrderButton = screen.getByRole("button", { name: /sort order: ascending/i })
      expect(sortOrderButton.textContent).toContain("Ascending")
    })

    it("displays correct icon for descending order", () => {
      render(<FilterControls {...defaultProps} sortOrder="desc" />)

      const sortOrderButton = screen.getByRole("button", { name: /sort order: descending/i })
      expect(sortOrderButton.textContent).toContain("Descending")
    })
  })

  describe("Accessibility", () => {
    it("has proper ARIA labels for filter groups", () => {
      render(<FilterControls {...defaultProps} />)

      expect(screen.getByRole("group", { name: /filter and sort controls/i })).toBeTruthy()
      expect(screen.getByRole("group", { name: /ac filter/i })).toBeTruthy()
      expect(screen.getByRole("group", { name: /coach type filter/i })).toBeTruthy()
    })

    it("has proper aria-pressed attributes on toggle buttons", () => {
      render(
        <FilterControls
          {...defaultProps}
          acFilter={true}
          coachTypeFilter={["express"]}
        />
      )

      const acButton = screen.getByRole("button", { name: /filter by air conditioned buses/i })
      const expressButton = screen.getByRole("button", { name: /filter by express coach/i })

      expect(acButton.getAttribute("aria-pressed")).toBe("true")
      expect(expressButton.getAttribute("aria-pressed")).toBe("true")
    })

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup()
      const onACFilterChange = vi.fn()

      render(<FilterControls {...defaultProps} onACFilterChange={onACFilterChange} />)

      const acButton = screen.getByRole("button", { name: /filter by air conditioned buses/i })
      
      // Tab to button and press Enter
      await user.tab()
      await user.keyboard("{Enter}")

      expect(onACFilterChange).toHaveBeenCalled()
    })
  })

  describe("Visual States", () => {
    it("applies custom className", () => {
      const { container } = render(<FilterControls {...defaultProps} className="custom-class" />)

      const filterControls = container.firstChild as HTMLElement
      expect(filterControls.className).toContain("custom-class")
    })

    it("renders all section labels", () => {
      render(<FilterControls {...defaultProps} />)

      expect(screen.getByText("Air Conditioning")).toBeTruthy()
      expect(screen.getByText("Coach Type")).toBeTruthy()
      expect(screen.getByText("Sort By")).toBeTruthy()
    })
  })
})
