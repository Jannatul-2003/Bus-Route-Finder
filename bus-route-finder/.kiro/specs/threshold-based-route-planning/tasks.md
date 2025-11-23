# Implementation Plan

- [x] 1. Update database schema and add migration scripts
  - Create migration SQL file for buses table enhancements (is_ac, coach_type columns)
  - Create migration SQL file for route_stops table enhancements (distance_to_next, duration_to_next columns)
  - Add database indexes for new columns
  - Create seed data script with sample Dhaka bus routes including distances
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 1.1 Write property test for coach type validation
  - **Property 18: Coach Type Validation**
  - **Validates: Requirements 7.4**

- [x] 2. Implement Builder Pattern for bus filtering
  - Create BusFilterBuilder class with fluent interface methods
  - Implement withAC(), withCoachTypes(), withJourneyLengthRange(), withMaxWalkingDistance() methods
  - Implement apply() method for client-side filtering
  - Implement buildSupabaseQuery() method for database-level filtering
  - Implement reset() method
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 2.1 Write property test for AC filter correctness
  - **Property 14: AC Filter Correctness**
  - **Validates: Requirements 6.2, 6.3**

- [ ]* 2.2 Write property test for coach type filter correctness
  - **Property 15: Coach Type Filter Correctness**
  - **Validates: Requirements 6.4**

- [ ]* 2.3 Write property test for multiple filter conjunction
  - **Property 16: Multiple Filter Conjunction**
  - **Validates: Requirements 6.5**

- [x] 3. Implement Decorator Pattern for enhanced bus results
  - Create base BusResult interface
  - Create abstract BusResultDecorator class
  - Implement JourneyLengthDecorator
  - Implement WalkingDistanceDecorator
  - Implement TimeEstimateDecorator
  - Create EnhancedBusResultFactory for composing decorators
  - _Requirements: 5.1, 5.5, 9.1, 9.2_

- [ ]* 3.1 Write property test for journey length calculation
  - **Property 12: Journey Length Calculation**
  - **Validates: Requirements 5.1**

- [ ]* 3.2 Write property test for distance display formatting
  - **Property 13: Distance Display Formatting**
  - **Validates: Requirements 5.5, 9.4**

- [x] 4. Create StopDiscoveryService
  - Implement StopDiscoveryService class with DistanceCalculator dependency
  - Implement discoverStops() method using OSRM/Haversine strategy
  - Implement fetchAllStops() method for Supabase queries
  - Add threshold filtering logic
  - Add distance sorting
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 4.1 Write property test for stop discovery within threshold
  - **Property 4: Stop Discovery Within Threshold**
  - **Validates: Requirements 2.1, 2.2**

- [ ]* 4.2 Write property test for fallback notification
  - **Property 20: Fallback Notification**
  - **Validates: Requirements 8.5**

- [x] 5. Create BusRouteService
  - Implement BusRouteService class with Supabase client dependency
  - Implement findBusRoutes() method to query buses serving both stops
  - Implement calculateJourneyLength() method using pre-calculated distances
  - Implement filterValidRoutes() helper to ensure correct stop ordering
  - Add fallback logic for missing distance_to_next values
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.4_

- [ ]* 5.1 Write property test for bus route ordering invariant
  - **Property 9: Bus Route Ordering Invariant**
  - **Validates: Requirements 4.2**

- [ ]* 5.2 Write property test for bus result completeness
  - **Property 10: Bus Result Completeness**
  - **Validates: Requirements 4.4**

- [ ]* 5.3 Write property test for active bus filter
  - **Property 11: Active Bus Filter**
  - **Validates: Requirements 4.5**

- [x] 6. Update RoutePlannerState interface and store
  - Extend RoutePlannerState with threshold fields (startingThreshold, destinationThreshold)
  - Add startingStops and destinationStops arrays
  - Add selectedOnboardingStop and selectedOffboardingStop fields
  - Add walkingDistanceToOnboarding and walkingDistanceFromOffboarding fields
  - Add filters and sorting fields
  - Update initialState with default threshold values (500m)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 6.1 Write property test for default threshold application
  - **Property 1: Default Threshold Application**
  - **Validates: Requirements 1.2**

- [ ]* 6.2 Write property test for threshold validation range
  - **Property 2: Threshold Validation Range**
  - **Validates: Requirements 1.3**

- [x] 7. Implement threshold-based stop discovery in store
  - Add setStartingThreshold() and setDestinationThreshold() methods
  - Implement discoverStopsNearLocation() method using StopDiscoveryService
  - Add threshold validation logic
  - Implement stop grouping (starting vs destination)
  - Add error handling for invalid thresholds
  - _Requirements: 1.3, 1.5, 2.1, 2.2, 2.5_

- [ ]* 7.1 Write property test for threshold change reactivity
  - **Property 3: Threshold Change Reactivity**
  - **Validates: Requirements 1.5**

- [ ]* 7.2 Write property test for stop grouping consistency
  - **Property 5: Stop Grouping Consistency**
  - **Validates: Requirements 2.5, 3.1**

- [x] 8. Implement stop selection logic in store
  - Add selectOnboardingStop() method
  - Add selectOffboardingStop() method
  - Implement walking distance calculation using DistanceCalculator
  - Update UI state to enable/disable controls based on selections
  - _Requirements: 3.3, 3.4, 3.5, 3.6_

- [ ]* 8.1 Write property test for selection state propagation
  - **Property 7: Selection State Propagation**
  - **Validates: Requirements 3.3**

- [ ]* 8.2 Write property test for walking distance calculation
  - **Property 8: Walking Distance Calculation**
  - **Validates: Requirements 3.4, 3.5, 9.1, 9.2**

- [x] 9. Implement bus search with filtering and sorting
  - Add searchBusesForRoute() method using BusRouteService
  - Integrate EnhancedBusResultFactory to decorate results
  - Add applyFilters() method using BusFilterBuilder
  - Add sortBuses() method with configurable sort criteria
  - Implement filter state management (setACFilter, setCoachTypeFilter)
  - Implement sort state management (setSortBy, setSortOrder)
  - _Requirements: 4.1, 4.2, 4.5, 6.2, 6.3, 6.4, 6.5, 6.7_

- [ ]* 9.1 Write property test for sort order preservation
  - **Property 17: Sort Order Preservation**
  - **Validates: Requirements 6.7**

- [x] 10. Create modern UI components - ThresholdInput
  - Create ThresholdInput component with number input and validation
  - Add visual feedback for valid/invalid values
  - Implement range validation (100-5000m)
  - Add optional checkbox for "no threshold" on destination
  - Style with modern design (rounded corners, shadows, transitions)
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 11. Create modern UI components - StopSelectionCard
  - Create StopSelectionCard component displaying stop name and distance
  - Add distance badge with color coding (green < 300m, yellow < 600m, orange > 600m)
  - Implement selection state (checkbox/radio with highlight)
  - Add hover effects and smooth transitions
  - Ensure accessibility with ARIA labels
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 11.1 Write property test for stop display completeness
  - **Property 6: Stop Display Completeness**
  - **Validates: Requirements 3.2**

- [x] 12. Create modern UI components - BusResultCard
  - Create BusResultCard component with bus information display
  - Add badges for AC/Non-AC and coach type (Express/Standard/Luxury)
  - Display journey length prominently with icon
  - Show route visualization (stop sequence with arrows)
  - Display walking distances at both ends with walking icon
  - Add estimated time display
  - Implement expandable details section
  - Style with card design (shadow, border-radius, padding)
  - _Requirements: 4.4, 5.5, 9.4_

- [x] 13. Create modern UI components - FilterControls
  - Create FilterControls component with toggle buttons for AC/Non-AC
  - Add multi-select for coach types (Standard, Express, Luxury)
  - Add sort dropdown (Journey Length, Estimated Time, Name)
  - Add sort order toggle (Ascending/Descending)
  - Style with modern button design and active states
  - Ensure keyboard navigation support
  - _Requirements: 6.1, 6.6_

- [x] 14. Build main RoutePlannerPage layout
  - Create responsive 2-column grid layout (stacked on mobile)
  - Add location input section with autocomplete
  - Add threshold input controls for both locations
  - Add "Get Current Location" button
  - Add "Search Stops" button
  - Integrate map component in right column
  - Add loading states with skeleton loaders
  - Add error display with retry actions
  - Implement dark mode toggle
  - _Requirements: 1.1, 1.5, 2.5, 3.1_

- [x] 15. Implement stop discovery and display
  - Connect ThresholdInput to store actions
  - Display discovered stops in two sections (starting/destination)
  - Render StopSelectionCard for each stop
  - Add empty state when no stops found
  - Add loading indicators during discovery
  - Implement scroll behavior for long lists
  - _Requirements: 2.1, 2.2, 2.5, 3.1, 3.2_

- [x] 16. Implement stop selection and bus search
  - Connect StopSelectionCard selection to store actions
  - Display walking distances after selection
  - Show warning for walking distances > 2000m
  - Trigger bus search when both stops selected
  - Display loading state during bus search
  - Handle empty bus results with helpful message
  - _Requirements: 3.3, 3.4, 3.5, 3.6, 4.3, 9.5_

- [x] 17. Implement bus results display with filtering
  - Render BusResultCard for each bus result
  - Connect FilterControls to store filter actions
  - Apply filters reactively as user changes selections
  - Display filtered count (e.g., "Showing 5 of 12 buses")
  - Add empty state when filters eliminate all results
  - Implement sort functionality
  - _Requirements: 4.4, 4.5, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 18. Enhance map visualization
  - Display all discovered stops as markers on map
  - Highlight selected onboarding stop with distinct marker (green)
  - Highlight selected offboarding stop with distinct marker (red)
  - Display starting location marker (blue)
  - Display destination location marker (purple)
  - Draw polyline from starting location to onboarding stop
  - Draw polyline from offboarding stop to destination location
  - Add map controls (zoom, center)
  - Implement auto-zoom to fit all markers
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 18.1 Write property test for map marker display
  - **Property 21: Map Marker Display**
  - **Validates: Requirements 10.2, 10.3**

- [ ]* 18.2 Write property test for complete route visualization
  - **Property 22: Complete Route Visualization**
  - **Validates: Requirements 10.4, 10.5**

- [ ] 19. Implement error handling and edge cases
  - Add OSRM timeout handling (30 seconds)
  - Implement fallback to Haversine with user notification
  - Handle geolocation permission denial
  - Add retry logic for database connection failures (3 attempts)
  - Handle missing distance_to_next with OSRM calculation and warning log
  - Validate coordinates before distance calculations
  - Add React error boundaries for component errors
  - _Requirements: 2.3, 5.4, 8.3, 8.4, 8.5_

- [ ]* 19.1 Write property test for OSRM error handling
  - **Property 19: OSRM Error Handling**
  - **Validates: Requirements 8.3**

- [ ] 20. Create API routes for enhanced queries
  - Create /api/stops/within-threshold endpoint for stop discovery
  - Create /api/buses/between-stops endpoint for bus route queries
  - Create /api/route-stops/journey-length endpoint for distance calculation
  - Add query parameter validation
  - Implement error responses with appropriate status codes
  - Add request logging
  - _Requirements: 2.1, 2.2, 4.1, 5.1_

- [ ] 21. Add accessibility features
  - Add ARIA labels to all interactive elements
  - Implement keyboard navigation for stop selection
  - Add focus indicators for all focusable elements
  - Ensure color contrast meets WCAG AA standards
  - Add screen reader announcements for dynamic content updates
  - Test with keyboard-only navigation
  - _Requirements: 3.2, 3.3, 6.1_

- [ ] 22. Optimize performance
  - Implement debouncing for threshold input changes (300ms)
  - Add memoization for expensive calculations (journey length, filtering)
  - Virtualize long stop lists (react-window)
  - Lazy load map component
  - Optimize Supabase queries with proper indexes
  - Add caching for frequently accessed data
  - _Requirements: 2.1, 2.2, 5.1, 6.7_

- [ ] 23. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 24. Add responsive design and mobile optimization
  - Implement mobile-first responsive breakpoints
  - Stack columns vertically on mobile
  - Optimize touch targets for mobile (min 44x44px)
  - Add swipe gestures for map navigation
  - Optimize map rendering for mobile devices
  - Test on various screen sizes (320px to 1920px)
  - _Requirements: 1.1, 2.5, 3.1_

- [ ] 25. Create documentation and examples
  - Document BusFilterBuilder usage with examples
  - Document Decorator pattern implementation
  - Add JSDoc comments to all public methods
  - Create README for database migration process
  - Document OSRM setup for Dhaka city
  - Add example seed data for testing
  - _Requirements: All_

- [ ] 26. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
