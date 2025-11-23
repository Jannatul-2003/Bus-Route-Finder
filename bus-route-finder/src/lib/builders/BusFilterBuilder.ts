/**
 * Builder Pattern - Bus Filter Builder
 * 
 * Provides a fluent interface for constructing complex bus filter queries.
 * Supports both client-side filtering and database-level query building.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import type { EnhancedBusResult } from '../decorators/BusResult'

/**
 * Builder for constructing bus filter queries with a fluent interface
 */
export class BusFilterBuilder {
  private filters: {
    isAC?: boolean
    coachTypes?: string[]
    minJourneyLength?: number
    maxJourneyLength?: number
    maxWalkingDistance?: number
  } = {}

  /**
   * Filter by AC/Non-AC
   * 
   * @param isAC - true for AC buses, false for non-AC buses
   * @returns this builder instance for chaining
   */
  withAC(isAC: boolean): this {
    this.filters.isAC = isAC
    return this
  }

  /**
   * Filter by coach types
   * 
   * @param types - Array of coach types to include ('standard', 'express', 'luxury')
   * @returns this builder instance for chaining
   */
  withCoachTypes(types: string[]): this {
    this.filters.coachTypes = types
    return this
  }

  /**
   * Filter by journey length range
   * 
   * @param min - Minimum journey length in kilometers (optional)
   * @param max - Maximum journey length in kilometers (optional)
   * @returns this builder instance for chaining
   */
  withJourneyLengthRange(min?: number, max?: number): this {
    if (min !== undefined) {
      this.filters.minJourneyLength = min
    }
    if (max !== undefined) {
      this.filters.maxJourneyLength = max
    }
    return this
  }

  /**
   * Filter by maximum walking distance
   * 
   * @param maxDistance - Maximum total walking distance in meters
   * @returns this builder instance for chaining
   */
  withMaxWalkingDistance(maxDistance: number): this {
    this.filters.maxWalkingDistance = maxDistance
    return this
  }

  /**
   * Apply filters to bus results (client-side filtering)
   * 
   * @param buses - Array of enhanced bus results to filter
   * @returns Filtered array of bus results
   */
  apply<T extends EnhancedBusResult>(buses: T[]): T[] {
    let filtered = buses

    // Filter by AC status
    if (this.filters.isAC !== undefined) {
      filtered = filtered.filter(bus => bus.isAC === this.filters.isAC)
    }

    // Filter by coach types
    if (this.filters.coachTypes && this.filters.coachTypes.length > 0) {
      filtered = filtered.filter(bus =>
        this.filters.coachTypes!.includes(bus.coachType)
      )
    }

    // Filter by minimum journey length
    if (this.filters.minJourneyLength !== undefined) {
      filtered = filtered.filter(bus =>
        bus.journeyLength >= this.filters.minJourneyLength!
      )
    }

    // Filter by maximum journey length
    if (this.filters.maxJourneyLength !== undefined) {
      filtered = filtered.filter(bus =>
        bus.journeyLength <= this.filters.maxJourneyLength!
      )
    }

    // Filter by maximum walking distance
    if (this.filters.maxWalkingDistance !== undefined) {
      filtered = filtered.filter(bus =>
        bus.totalDistance <= this.filters.maxWalkingDistance!
      )
    }

    return filtered
  }

  /**
   * Build Supabase query with filters (database-level filtering)
   * 
   * This method applies filters that can be executed at the database level
   * for better performance. Note that journey length and walking distance
   * filters cannot be applied here as they require computed values.
   * 
   * @param query - Supabase query builder instance
   * @returns Modified query builder with filters applied
   */
  buildSupabaseQuery(query: any): any {
    let modifiedQuery = query

    // Filter by AC status
    if (this.filters.isAC !== undefined) {
      modifiedQuery = modifiedQuery.eq('is_ac', this.filters.isAC)
    }

    // Filter by coach types
    if (this.filters.coachTypes && this.filters.coachTypes.length > 0) {
      modifiedQuery = modifiedQuery.in('coach_type', this.filters.coachTypes)
    }

    return modifiedQuery
  }

  /**
   * Reset all filters to empty state
   * 
   * @returns this builder instance for chaining
   */
  reset(): this {
    this.filters = {}
    return this
  }

  /**
   * Get current filter configuration (for debugging/inspection)
   * 
   * @returns Copy of current filters object
   */
  getFilters(): typeof this.filters {
    return { ...this.filters }
  }
}
