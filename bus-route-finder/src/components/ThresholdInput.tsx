import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { debounce } from "@/lib/utils/debounce"

interface ThresholdInputProps {
  value: number | null
  onChange: (value: number | null) => void
  label: string
  allowNoThreshold?: boolean
  className?: string
  error?: string
}

const MIN_THRESHOLD = 100
const MAX_THRESHOLD = 5000
const DEBOUNCE_DELAY = 300 // 300ms debounce for performance optimization

export function ThresholdInput({
  value,
  onChange,
  label,
  allowNoThreshold = false,
  className,
  error: externalError,
}: ThresholdInputProps) {
  const [inputValue, setInputValue] = React.useState<string>(
    value?.toString() || ""
  )
  const [noThreshold, setNoThreshold] = React.useState<boolean>(value === null)
  const [internalError, setInternalError] = React.useState<string>("")

  // Debounced onChange handler for performance optimization
  // Requirements 2.1, 2.2: Debounce threshold input changes (300ms)
  const debouncedOnChange = React.useMemo(
    () => debounce(onChange, DEBOUNCE_DELAY),
    [onChange]
  )

  // Sync external value changes
  React.useEffect(() => {
    if (value === null) {
      setNoThreshold(true)
      setInputValue("")
    } else {
      setNoThreshold(false)
      setInputValue(value.toString())
    }
  }, [value])

  const validateThreshold = (val: string): string => {
    if (val === "") {
      return "Threshold is required"
    }

    const numValue = Number(val)

    if (isNaN(numValue)) {
      return "Please enter a valid number"
    }

    if (numValue < MIN_THRESHOLD) {
      return `Threshold must be at least ${MIN_THRESHOLD}m`
    }

    if (numValue > MAX_THRESHOLD) {
      return `Threshold must not exceed ${MAX_THRESHOLD}m`
    }

    return ""
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Allow empty string for intermediate state
    if (newValue === "") {
      setInputValue("")
      setInternalError("Threshold is required")
      return
    }

    // Only allow numbers
    if (!/^\d+$/.test(newValue)) {
      return
    }

    setInputValue(newValue)

    const error = validateThreshold(newValue)
    setInternalError(error)

    if (!error) {
      const numValue = Number(newValue)
      // Use debounced onChange to reduce API calls
      debouncedOnChange(numValue)
    }
  }

  const handleBlur = () => {
    if (noThreshold) {
      return
    }

    if (inputValue === "") {
      setInternalError("Threshold is required")
      return
    }

    const error = validateThreshold(inputValue)
    setInternalError(error)
  }

  const handleNoThresholdChange = (checked: boolean) => {
    setNoThreshold(checked)

    if (checked) {
      setInputValue("")
      setInternalError("")
      onChange(null)
    } else {
      // Set to default value when unchecking
      const defaultValue = "500"
      setInputValue(defaultValue)
      setInternalError("")
      onChange(500)
    }
  }

  const displayError = externalError || internalError
  const isValid = !displayError && inputValue !== ""
  const isInvalid = !!displayError && inputValue !== ""

  return (
    <div className={cn("flex flex-col gap-2 sm:gap-3", className)} role="group" aria-labelledby={`threshold-${label}-label`}>
      <label
        id={`threshold-${label}-label`}
        htmlFor={`threshold-${label}`}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Input
            id={`threshold-${label}`}
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={noThreshold}
            placeholder="Enter threshold (100-5000m)"
            aria-invalid={isInvalid}
            aria-describedby={
              displayError ? `threshold-${label}-error` : undefined
            }
            className={cn(
              "pr-12 transition-all duration-200 min-h-[48px] text-base",
              isValid &&
                !noThreshold &&
                "border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/50",
              isInvalid && "border-destructive"
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {!noThreshold && inputValue && (
              <>
                {isValid && (
                  <svg
                    className="size-4 text-green-500 animate-in fade-in zoom-in duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                {isInvalid && (
                  <svg
                    className="size-4 text-destructive animate-in fade-in zoom-in duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </>
            )}
            <span className="text-xs text-muted-foreground">m</span>
          </div>
        </div>

        {displayError && (
          <p
            id={`threshold-${label}-error`}
            className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200"
            role="alert"
          >
            {displayError}
          </p>
        )}

        {allowNoThreshold && (
          <label
            htmlFor={`no-threshold-${label}`}
            className={cn(
              "flex items-center gap-2 cursor-pointer group transition-opacity duration-200",
              noThreshold && "opacity-100"
            )}
          >
            <input
              type="checkbox"
              id={`no-threshold-${label}`}
              checked={noThreshold}
              onChange={(e) => handleNoThresholdChange(e.target.checked)}
              aria-label={`No threshold for ${label}`}
              className={cn(
                "size-4 rounded border-input text-primary transition-all duration-200",
                "focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "cursor-pointer accent-primary"
              )}
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-200">
              No threshold (search all stops)
            </span>
          </label>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Valid range: {MIN_THRESHOLD}-{MAX_THRESHOLD} meters
      </p>
    </div>
  )
}
