import * as React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ThresholdInput } from "../ThresholdInput"

describe("ThresholdInput", () => {
  it("renders with label and default value", () => {
    const onChange = vi.fn()
    render(
      <ThresholdInput
        value={500}
        onChange={onChange}
        label="Starting Location"
      />
    )

    expect(screen.getByLabelText("Starting Location")).toBeTruthy()
    expect(screen.getByDisplayValue("500")).toBeTruthy()
  })

  it("validates minimum threshold (100m)", () => {
    const onChange = vi.fn()
    render(
      <ThresholdInput value={500} onChange={onChange} label="Test Threshold" />
    )

    const input = screen.getByLabelText("Test Threshold")
    fireEvent.change(input, { target: { value: "50" } })
    fireEvent.blur(input)

    expect(
      screen.getByText("Threshold must be at least 100m")
    ).toBeTruthy()
    expect(onChange).not.toHaveBeenCalledWith(50)
  })

  it("validates maximum threshold (5000m)", () => {
    const onChange = vi.fn()
    render(
      <ThresholdInput value={500} onChange={onChange} label="Test Threshold" />
    )

    const input = screen.getByLabelText("Test Threshold")
    fireEvent.change(input, { target: { value: "6000" } })
    fireEvent.blur(input)

    expect(
      screen.getByText("Threshold must not exceed 5000m")
    ).toBeTruthy()
    expect(onChange).not.toHaveBeenCalledWith(6000)
  })

  it("accepts valid threshold values", () => {
    const onChange = vi.fn()
    render(
      <ThresholdInput value={500} onChange={onChange} label="Test Threshold" />
    )

    const input = screen.getByLabelText("Test Threshold")
    fireEvent.change(input, { target: { value: "1000" } })

    expect(onChange).toHaveBeenCalledWith(1000)
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("shows visual feedback for valid values", () => {
    const onChange = vi.fn()
    render(
      <ThresholdInput value={500} onChange={onChange} label="Test Threshold" />
    )

    const input = screen.getByLabelText("Test Threshold")
    fireEvent.change(input, { target: { value: "1000" } })

    // Check for green checkmark icon (valid state)
    const svg = input.parentElement?.querySelector("svg")
    expect(svg).toBeTruthy()
    expect(svg?.classList.contains("text-green-500")).toBe(true)
  })

  it("shows visual feedback for invalid values", () => {
    const onChange = vi.fn()
    render(
      <ThresholdInput value={500} onChange={onChange} label="Test Threshold" />
    )

    const input = screen.getByLabelText("Test Threshold")
    fireEvent.change(input, { target: { value: "50" } })
    fireEvent.blur(input)

    // Check for error icon (invalid state)
    const svg = input.parentElement?.querySelector("svg")
    expect(svg).toBeTruthy()
    expect(svg?.classList.contains("text-destructive")).toBe(true)
  })

  it("renders no threshold checkbox when allowNoThreshold is true", () => {
    const onChange = vi.fn()
    render(
      <ThresholdInput
        value={500}
        onChange={onChange}
        label="Destination"
        allowNoThreshold={true}
      />
    )

    expect(
      screen.getByText("No threshold (search all stops)")
    ).toBeTruthy()
  })

  it("does not render no threshold checkbox when allowNoThreshold is false", () => {
    const onChange = vi.fn()
    render(
      <ThresholdInput
        value={500}
        onChange={onChange}
        label="Starting Location"
        allowNoThreshold={false}
      />
    )

    expect(
      screen.queryByText("No threshold (search all stops)")
    ).toBeNull()
  })

  it("handles no threshold checkbox toggle", () => {
    const onChange = vi.fn()
    render(
      <ThresholdInput
        value={500}
        onChange={onChange}
        label="Destination"
        allowNoThreshold={true}
      />
    )

    const checkbox = screen.getByRole("checkbox")
    fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledWith(null)

    // Input should be disabled
    const input = screen.getByLabelText("Destination") as HTMLInputElement
    expect(input.disabled).toBe(true)
  })

  it("restores default value when unchecking no threshold", () => {
    const onChange = vi.fn()
    render(
      <ThresholdInput
        value={null}
        onChange={onChange}
        label="Destination"
        allowNoThreshold={true}
      />
    )

    const checkbox = screen.getByRole("checkbox") as HTMLInputElement
    expect(checkbox.checked).toBe(true)

    fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledWith(500)
  })

  it("only allows numeric input", () => {
    const onChange = vi.fn()
    render(
      <ThresholdInput value={500} onChange={onChange} label="Test Threshold" />
    )

    const input = screen.getByLabelText("Test Threshold") as HTMLInputElement
    fireEvent.change(input, { target: { value: "abc" } })

    // Input value should not change
    expect(input.value).toBe("500")
  })

  it("displays range information", () => {
    const onChange = vi.fn()
    render(
      <ThresholdInput value={500} onChange={onChange} label="Test Threshold" />
    )

    expect(screen.getByText("Valid range: 100-5000 meters")).toBeTruthy()
  })

  it("handles empty input", () => {
    const onChange = vi.fn()
    render(
      <ThresholdInput value={500} onChange={onChange} label="Test Threshold" />
    )

    const input = screen.getByLabelText("Test Threshold")
    fireEvent.change(input, { target: { value: "" } })
    fireEvent.blur(input)

    expect(screen.getByText("Threshold is required")).toBeTruthy()
  })
})
