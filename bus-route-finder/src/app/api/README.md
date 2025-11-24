# API Routes Documentation

This document describes the enhanced API routes for the bus route planning system.

## Overview

The API provides three main endpoints for threshold-based route planning:

1. **Stop Discovery** - Find stops within a threshold distance
2. **Bus Route Queries** - Find buses between two stops
3. **Journey Length Calculation** - Calculate distance for a specific route

All endpoints include:
- Query parameter validation
- Appropriate HTTP status codes
- Request logging with unique request IDs
- Error handling with detailed error messages

## Endpoints

### 1. GET /api/stops/within-threshold

Discover bus stops within a threshold distance from a location using OSRM for accurate road network distances.

**Requirements:** 2.1, 2.2

#### Query Parameters

| Parameter | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `lat` | number | Yes | -90 to 90 | Latitude of reference location |
| `lng` | number | Yes | -180 to 180 | Longitude of reference location |
| `threshold` | number | Yes | 100 to 5000 | Maximum distance in meters |

#### Response

**Success (200):**
```json
{
  "stops": [
    {
      "id": "uuid",
      "name": "Stop Name",
      "latitude": 23.8103,
      "longitude": 90.4125,
      "distance": 250.5,
      "distanceMethod": "OSRM",
      "accessible": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 5,
  "threshold": 500,
  "location": {
    "lat": 23.8103,
    "lng": 90.4125
  }
}
```

**Error (400):**
```json
{
  "error": "Invalid threshold",
  "details": "Threshold must be a number between 100 and 5000 meters"
}
```

**Error (500):**
```json
{
  "error": "Failed to discover stops",
  "details": "Error message"
}
```

#### Example Usage

```bash
# Find stops within 500m of a location
curl "http://localhost:3000/api/stops/within-threshold?lat=23.8103&lng=90.4125&threshold=500"

# Find stops within 1km
curl "http://localhost:3000/api/stops/within-threshold?lat=23.8103&lng=90.4125&threshold=1000"
```

```typescript
// TypeScript/JavaScript
const response = await fetch(
  `/api/stops/within-threshold?lat=${lat}&lng=${lng}&threshold=${threshold}`
)
const data = await response.json()

if (response.ok) {
  console.log(`Found ${data.count} stops:`, data.stops)
} else {
  console.error('Error:', data.error, data.details)
}
```

---

### 2. GET /api/buses/between-stops

Find all buses that travel between two stops in the correct order (onboarding stop before offboarding stop).

**Requirements:** 4.1

#### Query Parameters

| Parameter | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `onboarding` | string (UUID) | Yes | Must be different from offboarding | ID of the onboarding stop |
| `offboarding` | string (UUID) | Yes | Must be different from onboarding | ID of the offboarding stop |

#### Response

**Success (200):**
```json
{
  "routes": [
    {
      "busId": "uuid",
      "bus": {
        "id": "uuid",
        "name": "Bus #42",
        "status": "active",
        "is_ac": true,
        "coach_type": "express"
      },
      "onboardingStop": {
        "id": "uuid",
        "name": "Stop A",
        "latitude": 23.8103,
        "longitude": 90.4125
      },
      "offboardingStop": {
        "id": "uuid",
        "name": "Stop B",
        "latitude": 23.8203,
        "longitude": 90.4225
      },
      "onboardingStopOrder": 1,
      "offboardingStopOrder": 5,
      "direction": "outbound",
      "routeStops": [...]
    }
  ],
  "count": 3,
  "onboardingStopId": "uuid",
  "offboardingStopId": "uuid"
}
```

**Error (400):**
```json
{
  "error": "Invalid stop selection",
  "details": "Onboarding and offboarding stops must be different"
}
```

**Error (500):**
```json
{
  "error": "Failed to find bus routes",
  "details": "Error message"
}
```

#### Example Usage

```bash
# Find buses between two stops
curl "http://localhost:3000/api/buses/between-stops?onboarding=stop-uuid-1&offboarding=stop-uuid-2"
```

```typescript
// TypeScript/JavaScript
const response = await fetch(
  `/api/buses/between-stops?onboarding=${onboardingId}&offboarding=${offboardingId}`
)
const data = await response.json()

if (response.ok) {
  console.log(`Found ${data.count} bus routes:`, data.routes)
} else {
  console.error('Error:', data.error, data.details)
}
```

---

### 3. GET /api/route-stops/journey-length

Calculate the journey length between two stops on a specific bus route using pre-calculated segment distances.

**Requirements:** 5.1

#### Query Parameters

| Parameter | Type | Required | Validation | Description |
|-----------|------|----------|------------|-------------|
| `busId` | string (UUID) | Yes | - | ID of the bus |
| `onboardingOrder` | number | Yes | Non-negative integer, < offboardingOrder | Stop order of onboarding stop |
| `offboardingOrder` | number | Yes | Non-negative integer, > onboardingOrder | Stop order of offboarding stop |
| `direction` | string | Yes | 'outbound' or 'inbound' | Route direction |

#### Response

**Success (200):**
```json
{
  "journeyLength": 2.5,
  "journeyLengthKm": 2.5,
  "journeyLengthMeters": 2500,
  "busId": "uuid",
  "onboardingStopOrder": 1,
  "offboardingStopOrder": 5,
  "direction": "outbound"
}
```

**Error (400):**
```json
{
  "error": "Invalid stop order",
  "details": "Onboarding stop must come before offboarding stop in the route"
}
```

**Error (500):**
```json
{
  "error": "Failed to calculate journey length",
  "details": "Error message"
}
```

#### Example Usage

```bash
# Calculate journey length
curl "http://localhost:3000/api/route-stops/journey-length?busId=bus-uuid&onboardingOrder=1&offboardingOrder=5&direction=outbound"
```

```typescript
// TypeScript/JavaScript
const response = await fetch(
  `/api/route-stops/journey-length?busId=${busId}&onboardingOrder=${onOrder}&offboardingOrder=${offOrder}&direction=${direction}`
)
const data = await response.json()

if (response.ok) {
  console.log(`Journey length: ${data.journeyLengthKm} km`)
} else {
  console.error('Error:', data.error, data.details)
}
```

---

## Error Handling

All endpoints follow consistent error handling patterns:

### HTTP Status Codes

- **200 OK** - Request successful
- **400 Bad Request** - Invalid parameters or validation failure
- **500 Internal Server Error** - Server-side error (database, OSRM, etc.)

### Error Response Format

All error responses include:
```json
{
  "error": "Brief error description",
  "details": "Detailed error message"
}
```

### Common Validation Errors

1. **Missing Parameters**
   - Status: 400
   - Error: "Missing required parameters"

2. **Invalid Coordinates**
   - Status: 400
   - Error: "Invalid latitude" or "Invalid longitude"

3. **Invalid Threshold**
   - Status: 400
   - Error: "Invalid threshold"
   - Details: Must be between 100 and 5000 meters

4. **Invalid Direction**
   - Status: 400
   - Error: "Invalid direction"
   - Details: Must be 'outbound' or 'inbound'

5. **Invalid Stop Order**
   - Status: 400
   - Error: "Invalid stop order"
   - Details: Onboarding must come before offboarding

---

## Request Logging

All endpoints include request logging with:
- Unique request ID (7-character random string)
- Request parameters
- Response time in milliseconds
- Error details (if applicable)

Example log output:
```
[3rzic4] GET /api/stops/within-threshold - lat=23.8103, lng=90.4125, threshold=500
[3rzic4] Found 5 stops within 500m in 245ms
```

---

## Integration with Services

These API routes integrate with the following services:

1. **StopDiscoveryService** - Discovers stops within threshold using OSRM/Haversine
2. **BusRouteService** - Finds bus routes and calculates journey lengths
3. **DistanceCalculator** - Calculates distances using Strategy pattern (OSRM with Haversine fallback)

### Retry Logic

All database operations include retry logic (3 attempts with exponential backoff) as per Requirements 8.4.

### OSRM Fallback

Distance calculations automatically fall back to Haversine when OSRM is unavailable (Requirements 8.3, 8.5).

---

## Testing

API route tests are located in `src/app/api/__tests__/api-routes.test.ts`.

Run tests:
```bash
npm test -- src/app/api/__tests__/api-routes.test.ts
```

Tests cover:
- Parameter validation
- Error responses
- Status codes
- Edge cases

---

## Performance Considerations

1. **Database Queries** - Optimized with proper indexes on bus_id, stop_id, stop_order
2. **Distance Calculations** - OSRM provides fast road network distances
3. **Caching** - Consider implementing caching for frequently accessed routes
4. **Rate Limiting** - Consider adding rate limiting for production use

---

## Future Enhancements

Potential improvements:
1. Add pagination for large result sets
2. Implement response caching
3. Add rate limiting
4. Support batch requests
5. Add WebSocket support for real-time updates
6. Add API versioning (e.g., /api/v1/...)
