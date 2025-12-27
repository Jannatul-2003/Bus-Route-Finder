"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CommunitySearchInputProps {
  searchQuery: string
  searchRadius: number
  isRadiusSet: boolean
  onSearchChange: (query: string) => void
  onRadiusChange: (radius: number) => void
  onRadiusSearch: (radius: number) => void // Pass the radius value for validation
  onNameSearch: () => void // Separate handler for name-based search
  disabled?: boolean
}

/**
 * Search input component with explicit search buttons
 * Simple text field for radius (integers only) with separate search button
 * Name search field with its own search button - no dynamic searching
 */
export function CommunitySearchInput({
  searchQuery,
  searchRadius,
  isRadiusSet,
  onSearchChange,
  onRadiusChange,
  onRadiusSearch,
  onNameSearch,
  disabled = false
}: CommunitySearchInputProps) {
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onSearchChange(value)
  }

  const [radiusError, setRadiusError] = React.useState<string | null>(null)

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Clear any previous errors when user starts typing
    setRadiusError(null)
    
    // Allow empty input
    if (inputValue === '') {
      onRadiusChange(0)
      return
    }
    
    // Only allow integers (no decimals)
    if (!/^\d+$/.test(inputValue)) {
      setRadiusError("Please enter a valid integer")
      return
    }
    
    const value = parseInt(inputValue, 10)
    onRadiusChange(value)
  }

  const handleRadiusSearch = () => {
    // Validate radius when search button is clicked
    if (!searchRadius) {
      setRadiusError("Please enter a radius value")
      return
    }
    
    if (searchRadius < 100) {
      setRadiusError("Minimum radius is 100 meters")
      return
    }
    
    if (searchRadius > 50000) {
      setRadiusError("Maximum radius is 50,000 meters (50km)")
      return
    }
    
    // Clear error and proceed with search
    setRadiusError(null)
    onRadiusSearch(searchRadius)
  }

  return (
    <div className="space-y-6">
      {/* Search Options */}
      <div className="flex flex-col sm:flex-row gap-4">

        {/* Search Radius - Simple Text Field with Button */}
        <div className="flex-1">
          <Label htmlFor="search-radius" className="text-sm font-medium mb-2 block">
            Search Radius (meters)
          </Label>
          
          <div className="flex gap-2">
            <Input
              id="search-radius"
              type="text"
              value={searchRadius || ''}
              onChange={handleRadiusChange}
              placeholder="e.g. 5000"
              disabled={disabled}
              className={cn(
                "h-10",
                radiusError 
                  ? "border-red-300 focus:border-red-500" 
                  : "border-border focus:border-primary"
              )}
            />
            <Button 
              onClick={handleRadiusSearch}
              disabled={disabled || !searchRadius}
              className="h-10 px-4"
            >
              Search
            </Button>
          </div>
          
          {/* Error Message */}
          {radiusError && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {radiusError}
            </p>
          )}
          
          {/* Help Text */}
          <p className="text-xs text-muted-foreground mt-1">
            Enter radius in meters (100-50000). Validation happens when you click Search.
          </p>
        </div>

        {/* Community Name Search */}
        <div className="flex-1">
          <Label htmlFor="community-search" className="text-sm font-medium mb-2 block">
            Search by Name
          </Label>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="community-search"
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Search communities by name..."
                disabled={disabled}
                className="h-10 pl-9"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <svg className="size-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => handleSearchInputChange({ target: { value: '' } } as any)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <Button 
              onClick={onNameSearch}
              disabled={disabled || !searchQuery.trim()}
              className="h-10 px-4"
            >
              Search
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-1">
            Search globally by community name
          </p>
        </div>
      </div>
    </div>
  )
}