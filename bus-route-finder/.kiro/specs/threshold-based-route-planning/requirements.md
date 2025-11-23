# Requirements Document

## Introduction

This document specifies requirements for an enhanced bus route planning system for Dhaka city that allows users to find optimal bus routes by selecting stops within configurable threshold distances from their starting location and destination. The system will use OSRM for distance calculations, support filtering by bus amenities (AC/non-AC, coach type), and calculate journey lengths based on pre-calculated inter-stop distances stored in the database.

## Glossary

- **System**: The bus route planning web application
- **User**: A person using the web application to plan bus routes
- **Starting Location**: The geographic point where the user begins their journey
- **Destination Location**: The geographic point where the user wants to end their journey
- **Threshold**: A distance radius (in meters or kilometers) within which bus stops are considered accessible
- **Onboarding Stop**: The bus stop where the user will board the bus
- **Offboarding Stop**: The bus stop where the user will exit the bus
- **OSRM**: Open Source Routing Machine, used for calculating real-world distances
- **Journey Length**: The total distance traveled on a bus from onboarding to offboarding stop
- **Route Segment**: The path between two consecutive stops on a bus route
- **Supabase**: The backend database system storing bus, stop, and route information
- **Stop Distance**: Pre-calculated distance between consecutive stops in a bus route

## Requirements

### Requirement 1: Threshold Configuration

**User Story:** As a user, I want to configure search thresholds for both starting and destination locations, so that I can control how far I'm willing to walk to reach bus stops.

#### Acceptance Criteria

1. WHEN the user accesses the route planning interface THEN the System SHALL display threshold input controls for both starting location and destination location
2. WHEN no threshold values are provided THEN the System SHALL apply default threshold values of 500 meters for starting location and 500 meters for destination location
3. WHEN the user sets a threshold value THEN the System SHALL validate that the value is a positive number between 100 meters and 5000 meters
4. WHEN the user chooses not to set a destination threshold THEN the System SHALL allow the destination threshold to be null and search all stops serving the selected route
5. WHERE the user modifies threshold values WHILE search results are displayed THEN the System SHALL update the available stops based on the new threshold values

### Requirement 2: Stop Discovery Using OSRM

**User Story:** As a user, I want the system to find all bus stops within my specified thresholds using real-world distances, so that I get accurate walking distance estimates.

#### Acceptance Criteria

1. WHEN the user provides a starting location and starting threshold THEN the System SHALL query OSRM to calculate road network distances to all bus stops and return stops within the specified threshold distance
2. WHEN the user provides a destination location and destination threshold THEN the System SHALL query OSRM to calculate road network distances to all bus stops and return stops within the specified threshold distance
3. WHEN OSRM is unavailable THEN the System SHALL fall back to Haversine distance calculation to filter stops within the threshold radius and notify the user that walking distances are approximate straight-line estimates
4. WHEN calculating distances to stops THEN the System SHALL use the Dhaka city map data configured in OSRM
5. WHEN stop discovery completes THEN the System SHALL display the found stops grouped by starting location stops and destination location stops in separate sections

### Requirement 3: Stop Selection Interface

**User Story:** As a user, I want to select my preferred onboarding and offboarding stops from the discovered stops, so that I can choose stops that are most convenient for me.

#### Acceptance Criteria

1. WHEN stops are discovered THEN the System SHALL display starting location stops in one section and destination location stops in another section
2. WHEN displaying stops THEN the System SHALL show the stop name and the calculated distance from the reference location (starting or destination)
3. WHEN the user selects an onboarding stop THEN the System SHALL highlight the selection and enable the offboarding stop selection
4. WHEN the user selects an offboarding stop THEN the System SHALL calculate and display the distance from starting location to onboarding stop using OSRM
5. WHEN the user selects an offboarding stop THEN the System SHALL calculate and display the distance from offboarding stop to destination location using OSRM
6. WHEN both stops are selected THEN the System SHALL enable the bus route search functionality

### Requirement 4: Bus Route Retrieval

**User Story:** As a user, I want to see all buses that travel between my selected onboarding and offboarding stops, so that I can choose the best bus for my journey.

#### Acceptance Criteria

1. WHEN the user selects both onboarding and offboarding stops THEN the System SHALL query Supabase to find all buses that serve both stops in the correct order
2. WHEN querying for buses THEN the System SHALL verify that the onboarding stop appears before the offboarding stop in the bus route sequence
3. WHEN no buses are found THEN the System SHALL display a message indicating no direct bus routes are available between the selected stops
4. WHEN buses are found THEN the System SHALL retrieve all bus information including name, status, amenities (AC/non-AC), and coach type from Supabase
5. WHEN displaying bus results THEN the System SHALL show only active buses

### Requirement 5: Journey Length Calculation

**User Story:** As a user, I want to see the journey length for each bus option, so that I can choose the shortest or most efficient route.

#### Acceptance Criteria

1. WHEN displaying bus options THEN the System SHALL calculate the journey length as the sum of all segment distances between onboarding and offboarding stops
2. WHEN calculating journey length THEN the System SHALL retrieve pre-calculated distances between consecutive stops from the Supabase database
3. WHERE a bus route is A→B→C→D WHEN the onboarding stop is A and offboarding stop is D THEN the System SHALL calculate journey length as distance(A,B) + distance(B,C) + distance(C,D)
4. WHEN segment distances are missing from the database THEN the System SHALL calculate the distance using OSRM and log a warning for database update
5. WHEN journey length is calculated THEN the System SHALL display the length in kilometers with two decimal precision

### Requirement 6: Bus Filtering and Sorting

**User Story:** As a user, I want to filter buses by amenities and sort them by journey length, so that I can quickly find buses that meet my preferences.

#### Acceptance Criteria

1. WHEN bus results are displayed THEN the System SHALL provide filter controls for AC/non-AC and coach type
2. WHEN the user selects AC filter THEN the System SHALL display only buses with air conditioning
3. WHEN the user selects non-AC filter THEN the System SHALL display only buses without air conditioning
4. WHEN the user selects a coach type filter THEN the System SHALL display only buses matching that coach type
5. WHEN the user applies multiple filters THEN the System SHALL display buses that satisfy all selected filter criteria
6. WHEN bus results are displayed THEN the System SHALL provide a sort option to order buses by journey length in ascending or descending order
7. WHEN the user sorts by journey length THEN the System SHALL reorder the displayed buses accordingly while maintaining applied filters

### Requirement 7: Database Schema Enhancement

**User Story:** As a system administrator, I want the database schema to support pre-calculated distances and bus amenities, so that the system can efficiently calculate journey lengths and filter buses.

#### Acceptance Criteria

1. WHEN the route_stops table is queried THEN the System SHALL retrieve a distance_to_next field containing the pre-calculated distance to the next stop in the route
2. WHEN the buses table is queried THEN the System SHALL retrieve amenity fields including is_ac (boolean) and coach_type (text)
3. WHEN a new route segment is added THEN the System SHALL require the distance_to_next value to be populated
4. WHEN bus information is stored THEN the System SHALL validate that coach_type is one of the allowed values: 'standard', 'express', 'luxury'
5. WHEN querying route segments THEN the System SHALL use database indexes on (bus_id, stop_order, direction) for efficient retrieval

### Requirement 8: OSRM Integration for Dhaka City

**User Story:** As a system administrator, I want OSRM configured specifically for Dhaka city, so that distance calculations are accurate and performant for the target region.

#### Acceptance Criteria

1. WHEN the System initializes THEN the System SHALL configure OSRM with Dhaka city map data
2. WHEN OSRM calculates distances THEN the System SHALL use road network routing appropriate for Dhaka's street layout
3. WHEN OSRM requests are made THEN the System SHALL include appropriate error handling and timeout configurations
4. WHEN OSRM is unavailable THEN the System SHALL fall back to Haversine distance calculation
5. WHEN using fallback distance calculation THEN the System SHALL display a notification to the user that distances are approximate

### Requirement 9: Distance Calculation Display

**User Story:** As a user, I want to see the walking distances from my starting location to the onboarding stop and from the offboarding stop to my destination, so that I can assess the total journey effort.

#### Acceptance Criteria

1. WHEN the user selects an onboarding stop THEN the System SHALL display the walking distance from starting location to onboarding stop
2. WHEN the user selects an offboarding stop THEN the System SHALL display the walking distance from offboarding stop to destination location
3. WHEN displaying walking distances THEN the System SHALL use OSRM for accurate road network distances
4. WHEN displaying walking distances THEN the System SHALL show distances in meters if less than 1000 meters, otherwise in kilometers
5. WHEN walking distances exceed 2000 meters THEN the System SHALL display a warning that the walking distance may be too far

### Requirement 10: Route Visualization

**User Story:** As a user, I want to see my selected stops and route on a map, so that I can visually understand my journey.

#### Acceptance Criteria

1. WHEN stops are discovered THEN the System SHALL display all discovered stops on an interactive map
2. WHEN the user selects an onboarding stop THEN the System SHALL highlight that stop on the map with a distinct marker
3. WHEN the user selects an offboarding stop THEN the System SHALL highlight that stop on the map with a distinct marker
4. WHEN both stops are selected THEN the System SHALL display the starting location, onboarding stop, offboarding stop, and destination location on the map
5. WHEN displaying the route THEN the System SHALL draw lines connecting starting location to onboarding stop, and offboarding stop to destination location
