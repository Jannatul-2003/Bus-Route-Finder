# Bus Route Finder - API & Authentication Analysis

## Table of Contents
1. [Backend API Endpoints](#backend-api-endpoints)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Fetching Patterns](#data-fetching-patterns)
4. [API Request/Response Examples](#api-requestresponse-examples)
5. [Recommended API Format](#recommended-api-format)

---

## 1. Backend API Endpoints

Your project has **13 API endpoints** organized in the `/src/app/api` directory:

### 🚏 Stop Discovery APIs

#### 1. `GET /api/stops/within-threshold`
**Purpose:** Find bus stops within a threshold distance from a location using OSRM for road network distances.

**Query Parameters:**
- `lat` (number, required): Latitude (-90 to 90)
- `lng` (number, required): Longitude (-180 to 180)
- `threshold` (number, required): Maximum distance in meters (100-5000)

**What it does:**
- Uses OSRM for accurate road network distances
- Falls back to Haversine if OSRM unavailable
- Returns stops sorted by distance

---

#### 2. `GET /api/stops/search`
**Purpose:** Search for stops by name (fuzzy search).

**Query Parameters:**
- `q` (string, required): Search query

**What it does:**
- Searches stop names in the database
- Returns matching stops with coordinates

---

#### 3. `GET /api/stops`
**Purpose:** Get all stops from the database.

**What it does:**
- Returns complete list of bus stops

---

### 🚌 Bus Route APIs

#### 4. `GET /api/buses/between-stops`
**Purpose:** Find all buses that travel between two stops in the correct order.

**Query Parameters:**
- `onboarding` (UUID, required): ID of the onboarding stop
- `offboarding` (UUID, required): ID of the offboarding stop

**What it does:**
- Validates stops are different
- Finds buses serving both stops
- Ensures onboarding stop comes before offboarding stop in route
- Returns only active buses

---

#### 5. `GET /api/buses`
**Purpose:** Get all buses.

**What it does:**
- Returns list of all buses with their status
- Used for bus management

---

#### 6. `POST /api/buses`
**Purpose:** Create a new bus (contributor only).

**Body:**
```json
{
  "name": "Bus #42",
  "status": "active"
}
```

**What it does:**
- Creates new bus entry
- Sets default status to "active"

---

#### 7. `GET /api/buses/[id]`
**Purpose:** Get a specific bus by ID.

**What it does:**
- Returns bus details

---

#### 8. `PUT /api/buses/[id]`
**Purpose:** Update a bus (contributor only).

**What it does:**
- Updates bus name and status

---

#### 9. `DELETE /api/buses/[id]`
**Purpose:** Delete a bus (contributor only).

**What it does:**
- Removes bus from database

---

### 📏 Route Calculation APIs

#### 10. `GET /api/route-stops/journey-length`
**Purpose:** Calculate journey length between two stops on a specific bus route.

**Query Parameters:**
- `busId` (UUID, required): ID of the bus
- `onboardingOrder` (number, required): Stop order of onboarding stop
- `offboardingOrder` (number, required): Stop order of offboarding stop
- `direction` (string, required): 'outbound' or 'inbound'

**What it does:**
- Calculates distance using pre-calculated segment distances
- Validates stop order (onboarding < offboarding)
- Returns distance in km and meters

---

#### 11. `GET /api/route-stops`
**Purpose:** Get route stops for a specific bus.

**Query Parameters:**
- `bus_id` (UUID, optional): Filter by bus ID

**What it does:**
- Returns all stops on a bus route with order and direction

---

#### 12. `GET /api/route-stops/by-stop`
**Purpose:** Find all buses serving a specific stop.

**Query Parameters:**
- `stop_id` (UUID, required): Stop ID

**What it does:**
- Returns buses that include this stop in their route

---

#### 13. `GET /api/route-stops/closest`
**Purpose:** Find the closest stop on a bus route to given coordinates.

**Query Parameters:**
- `bus_id` (UUID, required): Bus ID
- `latitude` (number, required): Reference latitude
- `longitude` (number, required): Reference longitude

**What it does:**
- Finds nearest stop on the bus route to the given location

---

### 📝 Review APIs

#### 14. `GET /api/reviews`
**Purpose:** Get reviews for buses.

**Query Parameters:**
- `bus_id` (UUID, optional): Filter by bus ID

**What it does:**
- Returns reviews ordered by creation date

---

#### 15. `POST /api/reviews`
**Purpose:** Create a new review.

**Body:**
```json
{
  "bus_id": "uuid",
  "rating": 4,
  "comment": "Great service!"
}
```

**What it does:**
- Creates new review with timestamp

---

### ⚙️ User Settings APIs

#### 16. `GET /api/user-settings`
**Purpose:** Get user settings for authenticated user.

**What it does:**
- Returns user preferences

---

#### 17. `POST /api/user-settings`
**Purpose:** Update user settings.

**Body:**
```json
{
  "theme": "dark",
  "notifications": true
}
```

**What it does:**
- Upserts user settings

---

### 📍 Distance Calculation API

#### 18. `POST /api/distance`
**Purpose:** Calculate distances between multiple origins and destinations.

**Body:**
```json
{
  "origins": [{ "lat": 23.8103, "lng": 90.4125 }],
  "destinations": [{ "lat": 23.8203, "lng": 90.4225 }]
}
```

**What it does:**
- Uses Strategy Pattern (OSRM with Haversine fallback)
- Returns distance matrix with durations

---

## 2. Authentication & Authorization

### Authentication Method
**Supabase Auth** with JWT tokens stored in HTTP-only cookies.

### How It Works

1. **Sign Up/Sign In:**
   - Users register/login via `/auth/login` or `/auth/register`
   - Supabase handles password hashing and JWT generation
   - Session stored in cookies via `@supabase/ssr`

2. **Session Management:**
   - `AuthProvider` wraps the app and provides auth context
   - Checks session on mount and listens for auth state changes
   - Fetches user profile to check `is_contributor` status

3. **User Roles:**
   - **Regular Users:** Can view buses, stops, and plan routes
   - **Contributors:** Can create, edit, and delete buses

### Public vs. Restricted Features

#### ✅ Public Features (No Login Required)
- **Route Planning:** Search stops, find buses, calculate routes
- **View Buses:** Browse all buses and their routes
- **View Stops:** See all bus stops on map
- **View Reviews:** Read reviews for buses
- **Distance Calculation:** Use OSRM/Haversine distance APIs

#### 🔒 Restricted Features (Login Required)
- **Bus Management:** Create, edit, delete buses (contributors only)
- **Add Reviews:** Post reviews for buses
- **User Settings:** Save personal preferences

### Authentication Implementation

**Client-Side (Browser):**
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const getSupabaseClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server-Side (API Routes):**
```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const getSupabaseServer = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => 
            cookieStore.set(name, value, options)
          )
        }
      }
    }
  )
}
```

**Auth Context:**
```typescript
// src/app/providers/AuthProvider.tsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Load session and fetch user profile
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        await fetchProfile(data.session.user.id, data.session.user)
      }
      setLoading(false)
    }
    
    // Fetch is_contributor status from user_profiles table
    const fetchProfile = async (userId: string, sessionUser: User) => {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("is_contributor")
        .eq("user_id", userId)
        .single()
      
      setUser({
        ...sessionUser,
        is_contributor: profile?.is_contributor || false
      })
    }
    
    loadSession()
    
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) fetchProfile(session.user.id, session.user)
        else setUser(null)
      }
    )
    
    return () => listener.subscription.unsubscribe()
  }, [])
  
  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}
```

### Checking Auth in Components

```typescript
import { useAuth } from '@/app/providers/AuthProvider'

function MyComponent() {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  if (!user) {
    return <div>Please log in</div>
  }
  
  if (user.is_contributor) {
    return <div>Contributor features</div>
  }
  
  return <div>Regular user features</div>
}
```

---

## 3. Data Fetching Patterns

Your app uses a **hybrid approach**:

### Pattern 1: API Routes (Preferred for Complex Logic)

**Used for:**
- Stop discovery with OSRM integration
- Bus route queries with validation
- Journey length calculations
- Distance calculations with fallback strategies

**Example:**
```typescript
// In routePlannerStore.ts
const response = await fetch(
  `/api/stops/within-threshold?lat=${lat}&lng=${lng}&threshold=${threshold}`
)
const data = await response.json()
```

**Why API Routes?**
- Encapsulates business logic (Strategy Pattern, Decorator Pattern)
- Provides retry logic and error handling
- Validates input parameters
- Logs requests with unique IDs
- Handles OSRM fallback to Haversine

---

### Pattern 2: Direct Supabase Calls (For Simple CRUD)

**Used for:**
- Fetching all buses
- Creating/updating/deleting buses
- Fetching reviews
- User settings

**Example:**
```typescript
// In buses/page.tsx
const response = await fetch("/api/buses")
const data = await response.json()
```

**Note:** Even "direct" Supabase calls go through API routes for consistency, but the API routes are thin wrappers.

---

### Pattern 3: Service Layer (Backend Logic)

**Used internally by API routes:**
- `StopDiscoveryService`: Discovers stops within threshold
- `BusRouteService`: Finds bus routes and calculates journey lengths
- `DistanceCalculator`: Strategy Pattern for OSRM/Haversine

**Example:**
```typescript
// In API route
const stopDiscoveryService = new StopDiscoveryService(distanceCalculator, supabase)
const stops = await stopDiscoveryService.discoverStops(location, threshold)
```

---

### Data Flow Architecture

```
Frontend Component
    ↓
Store (routePlannerStore)
    ↓
API Route (/api/stops/within-threshold)
    ↓
Service Layer (StopDiscoveryService)
    ↓
Strategy Pattern (DistanceCalculator → OSRM/Haversine)
    ↓
Supabase Database
```

---

## 4. API Request/Response Examples

### Example 1: Stop Discovery

**Request:**
```bash
GET /api/stops/within-threshold?lat=23.8103&lng=90.4125&threshold=500
```

**Response (200 OK):**
```json
{
  "stops": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Shahbagh",
      "latitude": 23.8103,
      "longitude": 90.4125,
      "distance": 250.5,
      "distanceMethod": "OSRM",
      "accessible": true,
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Science Lab",
      "latitude": 23.8123,
      "longitude": 90.4145,
      "distance": 480.2,
      "distanceMethod": "OSRM",
      "accessible": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 2,
  "threshold": 500,
  "location": {
    "lat": 23.8103,
    "lng": 90.4125
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Invalid threshold",
  "details": "Threshold must be a number between 100 and 5000 meters"
}
```

**Frontend Usage:**
```typescript
// In routePlannerStore.ts
async discoverStopsNearLocation(location: Coordinates, threshold: number, isStarting: boolean) {
  this.#setState({ loading: true, error: null })
  
  try {
    const service = this.#getStopDiscoveryService()
    const discoveredStops = await service.discoverStops(location, threshold)
    
    if (isStarting) {
      this.#setState({ startingStops: discoveredStops, loading: false })
    } else {
      this.#setState({ destinationStops: discoveredStops, loading: false })
    }
  } catch (error) {
    this.#setState({
      loading: false,
      error: `Failed to discover stops: ${error.message}`
    })
  }
}
```

---

### Example 2: Find Buses Between Stops

**Request:**
```bash
GET /api/buses/between-stops?onboarding=550e8400-e29b-41d4-a716-446655440000&offboarding=550e8400-e29b-41d4-a716-446655440001
```

**Response (200 OK):**
```json
{
  "routes": [
    {
      "busId": "660e8400-e29b-41d4-a716-446655440000",
      "bus": {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "name": "Bus #42",
        "status": "active",
        "is_ac": true,
        "coach_type": "express"
      },
      "onboardingStop": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Shahbagh",
        "latitude": 23.8103,
        "longitude": 90.4125
      },
      "offboardingStop": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Science Lab",
        "latitude": 23.8123,
        "longitude": 90.4145
      },
      "onboardingStopOrder": 1,
      "offboardingStopOrder": 5,
      "direction": "outbound",
      "routeStops": [
        {
          "id": "770e8400-e29b-41d4-a716-446655440000",
          "stop_order": 1,
          "stop": {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Shahbagh",
            "latitude": 23.8103,
            "longitude": 90.4125
          }
        },
        {
          "id": "770e8400-e29b-41d4-a716-446655440001",
          "stop_order": 2,
          "stop": {
            "id": "550e8400-e29b-41d4-a716-446655440002",
            "name": "Karwan Bazar",
            "latitude": 23.8113,
            "longitude": 90.4135
          }
        }
      ]
    }
  ],
  "count": 1,
  "onboardingStopId": "550e8400-e29b-41d4-a716-446655440000",
  "offboardingStopId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Frontend Usage:**
```typescript
// In routePlannerStore.ts
async searchBusesForRoute() {
  if (!this.#state.selectedOnboardingStop || !this.#state.selectedOffboardingStop) {
    this.#setState({ error: "Please select both stops" })
    return
  }
  
  this.#setState({ loading: true, error: null })
  
  try {
    const busRouteService = this.#getBusRouteService()
    const busRoutes = await busRouteService.findBusRoutes(
      this.#state.selectedOnboardingStop.id,
      this.#state.selectedOffboardingStop.id
    )
    
    // Process and enhance results...
    this.#setState({ availableBuses: enhancedBuses, loading: false })
  } catch (error) {
    this.#setState({
      loading: false,
      error: `Failed to search buses: ${error.message}`
    })
  }
}
```

---

### Example 3: Calculate Journey Length

**Request:**
```bash
GET /api/route-stops/journey-length?busId=660e8400-e29b-41d4-a716-446655440000&onboardingOrder=1&offboardingOrder=5&direction=outbound
```

**Response (200 OK):**
```json
{
  "journeyLength": 2.5,
  "journeyLengthKm": 2.5,
  "journeyLengthMeters": 2500,
  "busId": "660e8400-e29b-41d4-a716-446655440000",
  "onboardingStopOrder": 1,
  "offboardingStopOrder": 5,
  "direction": "outbound"
}
```

**Frontend Usage:**
```typescript
// In routePlannerStore.ts
const journeyLength = await busRouteService.calculateJourneyLength(
  route.busId,
  route.onboardingStopOrder,
  route.offboardingStopOrder,
  route.direction
)
```

---

### Example 4: Create Bus (Contributor Only)

**Request:**
```bash
POST /api/buses
Content-Type: application/json

{
  "name": "Bus #101",
  "status": "active"
}
```

**Response (201 Created):**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "name": "Bus #101",
  "status": "active",
  "created_at": "2024-11-27T10:30:00Z"
}
```

**Frontend Usage:**
```typescript
// In buses/page.tsx
const handleAddBus = async () => {
  const response = await fetch("/api/buses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: formData.name, status: formData.status })
  })
  
  if (response.ok) {
    const newBus = await response.json()
    setBuses([newBus, ...buses])
  }
}
```

---

### Example 5: Distance Calculation (Matrix)

**Request:**
```bash
POST /api/distance
Content-Type: application/json

{
  "origins": [
    { "lat": 23.8103, "lng": 90.4125 },
    { "lat": 23.8113, "lng": 90.4135 }
  ],
  "destinations": [
    { "lat": 23.8203, "lng": 90.4225 },
    { "lat": 23.8213, "lng": 90.4235 }
  ]
}
```

**Response (200 OK):**
```json
{
  "rows": [
    {
      "elements": [
        {
          "distance": { "text": "1.25 km", "value": 1250 },
          "duration": { "text": "3 mins", "value": 180 },
          "method": "OSRM"
        },
        {
          "distance": { "text": "1.50 km", "value": 1500 },
          "duration": { "text": "4 mins", "value": 240 },
          "method": "OSRM"
        }
      ]
    },
    {
      "elements": [
        {
          "distance": { "text": "1.10 km", "value": 1100 },
          "duration": { "text": "3 mins", "value": 180 },
          "method": "OSRM"
        },
        {
          "distance": { "text": "1.35 km", "value": 1350 },
          "duration": { "text": "3 mins", "value": 180 },
          "method": "OSRM"
        }
      ]
    }
  ],
  "status": "OK"
}
```

---

## 5. Recommended API Format

Based on your existing patterns, here's a consistent format for new APIs:

### Standard Success Response

```typescript
{
  // Primary data (array or object)
  "data": [...] | {...},
  
  // Metadata
  "count": 10,              // For arrays
  "page": 1,                // For pagination
  "pageSize": 20,           // For pagination
  "total": 100,             // Total count for pagination
  
  // Context (optional)
  "filters": {...},         // Applied filters
  "sort": {...},            // Applied sorting
  
  // Performance (optional)
  "method": "OSRM",         // Which strategy was used
  "cached": false,          // Was result cached
  "duration": 245           // Response time in ms
}
```

### Standard Error Response

```typescript
{
  "error": "Brief error message",
  "details": "Detailed explanation of what went wrong",
  "code": "INVALID_THRESHOLD",  // Machine-readable error code
  "field": "threshold",          // Which field caused the error (for validation)
  "timestamp": "2024-11-27T10:30:00Z"
}
```

### HTTP Status Codes

- **200 OK:** Successful GET/PUT request
- **201 Created:** Successful POST request
- **204 No Content:** Successful DELETE request
- **400 Bad Request:** Invalid parameters or validation failure
- **401 Unauthorized:** Authentication required
- **403 Forbidden:** Insufficient permissions
- **404 Not Found:** Resource not found
- **500 Internal Server Error:** Server-side error

### Request Logging Pattern

```typescript
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)
  
  console.log(`[${requestId}] GET /api/endpoint - params`)
  
  try {
    // ... logic ...
    
    const duration = Date.now() - startTime
    console.log(`[${requestId}] Success in ${duration}ms`)
    
    return NextResponse.json({ data, duration })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] Error in ${duration}ms:`, error)
    
    return NextResponse.json(
      { 
        error: "Brief message",
        details: error.message,
        requestId 
      },
      { status: 500 }
    )
  }
}
```

### Validation Pattern

```typescript
// Extract parameters
const searchParams = request.nextUrl.searchParams
const param = searchParams.get("param")

// Validate required
if (!param) {
  return NextResponse.json(
    { 
      error: "Missing required parameter",
      details: "param is required",
      field: "param"
    },
    { status: 400 }
  )
}

// Validate type and range
const numericParam = parseFloat(param)
if (isNaN(numericParam) || numericParam < 0 || numericParam > 100) {
  return NextResponse.json(
    { 
      error: "Invalid parameter",
      details: "param must be a number between 0 and 100",
      field: "param"
    },
    { status: 400 }
  )
}
```

---

## Summary

### Key Takeaways

1. **Hybrid Architecture:** Your app uses both API routes (for complex logic) and direct Supabase calls (for simple CRUD), with API routes being the preferred pattern.

2. **Authentication:** Supabase Auth with JWT in cookies. Most features are public; only bus management and reviews require login.

3. **Service Layer:** Business logic is encapsulated in services (`StopDiscoveryService`, `BusRouteService`) that use design patterns (Strategy, Decorator, Builder).

4. **Error Handling:** Consistent error responses with `error` and `details` fields, proper HTTP status codes, and request logging.

5. **Data Flow:** Frontend → Store → API Route → Service Layer → Supabase/OSRM

6. **Fallback Strategy:** OSRM for accurate distances with automatic Haversine fallback when unavailable.

### Best Practices You're Following

✅ Separation of concerns (API routes, services, stores)  
✅ Design patterns (Strategy, Decorator, Builder, Observer)  
✅ Input validation with detailed error messages  
✅ Request logging with unique IDs  
✅ Retry logic for database operations  
✅ Graceful fallback for external services  
✅ Type safety with TypeScript  
✅ Consistent API response format  

---

**Generated:** November 27, 2024  
**Project:** Bus Route Finder  
**Framework:** Next.js 15 + Supabase + TypeScript
