# OSRM Setup Guide for Dhaka City

## Overview

This guide provides comprehensive instructions for setting up Open Source Routing Machine (OSRM) with Dhaka city map data for accurate distance calculations in the Bus Route Planning system.

## What is OSRM?

OSRM (Open Source Routing Machine) is a high-performance routing engine that calculates:
- Road network distances (not straight-line)
- Optimal routes between points
- Turn-by-turn directions
- Travel time estimates

### Why OSRM for Dhaka?

- **Accuracy**: Uses actual road networks, not straight-line distances
- **Performance**: Fast calculations even for many points
- **Offline**: Can run locally without external API dependencies
- **Customizable**: Can be tuned for Dhaka's specific road conditions

## Requirements

Implements requirements: 8.1, 8.2, 8.3, 8.4, 8.5

## Prerequisites

### System Requirements

- **OS**: Linux (Ubuntu/Debian recommended), macOS, or Windows with WSL2
- **RAM**: Minimum 4GB, recommended 8GB+ for Bangladesh data
- **Disk Space**: ~5GB for Bangladesh OSM data and processed files
- **CPU**: Multi-core recommended for faster processing

### Software Requirements

- **Docker** (recommended) OR
- **OSRM Backend** compiled from source
- **wget** or **curl** for downloading data

## Installation Methods

### Method 1: Docker (Recommended)

Docker provides the easiest and most reliable way to run OSRM.

#### Step 1: Install Docker

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

**macOS:**
```bash
brew install docker docker-compose
```

**Windows:**
Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop)

#### Step 2: Download Bangladesh OSM Data

```bash
# Create directory for OSRM data
mkdir -p ~/osrm-data/bangladesh
cd ~/osrm-data/bangladesh

# Download Bangladesh OSM data from Geofabrik
wget https://download.geofabrik.de/asia/bangladesh-latest.osm.pbf

# Verify download
ls -lh bangladesh-latest.osm.pbf
```

**Alternative sources:**
- [Geofabrik](https://download.geofabrik.de/asia/bangladesh.html) - Updated daily
- [BBBike](https://extract.bbbike.org/) - Custom extracts for specific regions

#### Step 3: Extract and Process Data

```bash
# Extract road network
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-extract \
  -p /opt/car.lua /data/bangladesh-latest.osm.pbf

# Partition the graph
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-partition \
  /data/bangladesh-latest.osrm

# Customize the graph
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-customize \
  /data/bangladesh-latest.osrm
```

**Processing time:** 10-30 minutes depending on your system

**Expected output files:**
- `bangladesh-latest.osrm`
- `bangladesh-latest.osrm.ebg`
- `bangladesh-latest.osrm.edges`
- `bangladesh-latest.osrm.geometry`
- `bangladesh-latest.osrm.icd`
- `bangladesh-latest.osrm.cells`
- And more...

#### Step 4: Run OSRM Server

```bash
# Start OSRM server
docker run -t -i -p 5000:5000 -v "${PWD}:/data" \
  ghcr.io/project-osrm/osrm-backend osrm-routed \
  --algorithm mld /data/bangladesh-latest.osrm
```

**Server will be available at:** `http://localhost:5000`

#### Step 5: Verify Installation

```bash
# Test with a simple route query (Dhaka coordinates)
curl "http://localhost:5000/route/v1/driving/90.4125,23.8103;90.4074,23.7461?overview=false"
```

Expected response: JSON with route information

### Method 2: Docker Compose (Production)

For production deployments, use Docker Compose for better management.

#### Create docker-compose.yml

```yaml
version: '3.8'

services:
  osrm:
    image: ghcr.io/project-osrm/osrm-backend
    container_name: osrm-bangladesh
    ports:
      - "5000:5000"
    volumes:
      - ./osrm-data/bangladesh:/data
    command: osrm-routed --algorithm mld /data/bangladesh-latest.osrm
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

#### Run with Docker Compose

```bash
# Start OSRM
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f osrm

# Stop OSRM
docker-compose down
```

### Method 3: Native Installation (Advanced)

For advanced users who want to compile OSRM from source.

#### Install Dependencies (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install -y build-essential git cmake pkg-config \
  libbz2-dev libxml2-dev libzip-dev libboost-all-dev \
  lua5.2 liblua5.2-dev libtbb-dev
```

#### Clone and Build OSRM

```bash
# Clone repository
git clone https://github.com/Project-OSRM/osrm-backend.git
cd osrm-backend

# Create build directory
mkdir build
cd build

# Configure and build
cmake .. -DCMAKE_BUILD_TYPE=Release
cmake --build .

# Install
sudo cmake --build . --target install
```

#### Process Data and Run

```bash
# Extract
osrm-extract -p ../profiles/car.lua bangladesh-latest.osm.pbf

# Partition
osrm-partition bangladesh-latest.osrm

# Customize
osrm-customize bangladesh-latest.osrm

# Run server
osrm-routed --algorithm mld bangladesh-latest.osrm
```

## Configuration

### OSRM Profiles

OSRM uses profiles to define routing behavior. The default `car.lua` profile works well for Dhaka.

#### Custom Profile for Dhaka

Create `dhaka-car.lua` with Dhaka-specific settings:

```lua
-- Based on car.lua with Dhaka-specific adjustments

api_version = 4

Set = require('lib/set')
Sequence = require('lib/sequence')
Handlers = require("lib/way_handlers")
find_access_tag = require("lib/access").find_access_tag
limit = require("lib/maxspeed").limit

function setup()
  return {
    properties = {
      max_speed_for_map_matching      = 180/3.6,
      use_turn_restrictions           = true,
      continue_straight_at_waypoint   = true,
      weight_name                     = 'routability',
      process_call_tagless_node      = false,
      u_turn_penalty                 = 20,
      traffic_light_penalty          = 2,
      
      -- Dhaka-specific: Higher penalties for congestion
      left_hand_driving              = true,  -- Bangladesh drives on left
    },
    
    default_mode            = mode.driving,
    default_speed           = 20,  -- Dhaka average: 20 km/h
    oneway_handling         = true,
    
    -- Speed adjustments for Dhaka traffic
    speeds = {
      motorway        = 60,
      trunk           = 50,
      primary         = 40,
      secondary       = 30,
      tertiary        = 25,
      residential     = 20,
      living_street   = 15,
      service         = 15,
    },
    
    -- Road type priorities
    access_tag_whitelist = Set {
      'yes',
      'motor_vehicle',
      'vehicle',
      'permissive',
      'designated'
    },
    
    access_tag_blacklist = Set {
      'no',
      'private',
      'agricultural',
      'forestry',
      'emergency',
      'psv'
    },
  }
end

function process_node(profile, node, result)
  -- Process traffic lights with higher penalty for Dhaka
  local traffic_light = node:get_value_by_key("highway")
  if traffic_light == "traffic_signals" then
    result.traffic_lights = true
  end
end

function process_way(profile, way, result)
  local highway = way:get_value_by_key("highway")
  local name = way:get_value_by_key("name")
  
  if not highway then
    return
  end
  
  -- Set speed based on road type
  local speed = profile.speeds[highway]
  if speed then
    result.forward_speed = speed
    result.backward_speed = speed
  end
  
  -- Handle one-way streets
  local oneway = way:get_value_by_key("oneway")
  if oneway == "yes" or oneway == "1" or oneway == "true" then
    result.forward_mode = mode.driving
    result.backward_mode = mode.inaccessible
  elseif oneway == "-1" then
    result.forward_mode = mode.inaccessible
    result.backward_mode = mode.driving
  end
end

return {
  setup = setup,
  process_way = process_way,
  process_node = process_node,
  process_turn = process_turn
}
```

#### Use Custom Profile

```bash
# Extract with custom profile
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-extract \
  -p /data/dhaka-car.lua /data/bangladesh-latest.osm.pbf
```

### Environment Variables

Configure OSRM behavior with environment variables:

```bash
# In your .env.local file
OSRM_BASE_URL=http://localhost:5000
OSRM_TIMEOUT=30000  # 30 seconds
OSRM_MAX_RETRIES=3
```

### Application Configuration

Update your application to use OSRM:

```typescript
// src/lib/strategies/OSRMStrategy.ts

const OSRM_BASE_URL = process.env.OSRM_BASE_URL || 'http://localhost:5000'
const OSRM_TIMEOUT = parseInt(process.env.OSRM_TIMEOUT || '30000')

export class OSRMStrategy implements DistanceCalculationStrategy {
  async calculateDistances(
    origins: Coordinates[],
    destinations: Coordinates[]
  ): Promise<DistanceResult[][]> {
    // Implementation with timeout and error handling
    // See src/lib/strategies/OSRMStrategy.ts for full implementation
  }
}
```

## Testing OSRM

### Test Endpoints

#### 1. Health Check

```bash
curl http://localhost:5000/health
```

Expected: `{"status":"ok"}`

#### 2. Route Query

```bash
# Route from Mohakhali to Shahbag
curl "http://localhost:5000/route/v1/driving/90.4074,23.7806;90.3938,23.7389?overview=false"
```

#### 3. Table Query (Multiple Points)

```bash
# Distance matrix for multiple points
curl "http://localhost:5000/table/v1/driving/90.4074,23.7806;90.3938,23.7389;90.4125,23.8103?annotations=distance,duration"
```

#### 4. Nearest Road

```bash
# Find nearest road to a coordinate
curl "http://localhost:5000/nearest/v1/driving/90.4074,23.7806"
```

### Integration Test

Create a test script to verify OSRM integration:

```typescript
// scripts/test-osrm.ts

import { OSRMStrategy } from '../src/lib/strategies/OSRMStrategy'

async function testOSRM() {
  const osrm = new OSRMStrategy()
  
  // Test coordinates (Dhaka locations)
  const origins = [
    { lat: 23.7806, lng: 90.4074 }, // Mohakhali
    { lat: 23.7389, lng: 90.3938 }, // Shahbag
  ]
  
  const destinations = [
    { lat: 23.8103, lng: 90.4125 }, // Uttara
    { lat: 23.7461, lng: 90.4074 }, // Farmgate
  ]
  
  try {
    console.log('Testing OSRM connection...')
    const results = await osrm.calculateDistances(origins, destinations)
    
    console.log('✓ OSRM is working!')
    console.log('Sample distances:')
    results.forEach((row, i) => {
      row.forEach((result, j) => {
        console.log(`  ${i} → ${j}: ${result.distance.toFixed(2)} km`)
      })
    })
  } catch (error) {
    console.error('✗ OSRM test failed:', error)
    process.exit(1)
  }
}

testOSRM()
```

Run the test:

```bash
npx tsx scripts/test-osrm.ts
```

## Performance Optimization

### 1. Memory Allocation

Increase Docker memory for better performance:

```bash
# In docker-compose.yml
services:
  osrm:
    # ... other config
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G
```

### 2. Algorithm Selection

OSRM supports different algorithms:

- **MLD (Multi-Level Dijkstra)**: Fastest, recommended for production
- **CH (Contraction Hierarchies)**: Good balance of speed and memory

```bash
# Use MLD (default, recommended)
osrm-routed --algorithm mld bangladesh-latest.osrm

# Or use CH
osrm-routed --algorithm ch bangladesh-latest.osrm
```

### 3. Caching

Implement caching in your application:

```typescript
// Cache OSRM results for frequently queried routes
import { cache } from '@/lib/utils/cache'

async function getCachedDistance(origin: Coordinates, dest: Coordinates) {
  const cacheKey = `osrm:${origin.lat},${origin.lng}:${dest.lat},${dest.lng}`
  
  const cached = cache.get<number>(cacheKey)
  if (cached) return cached
  
  const distance = await osrm.calculateDistance(origin, dest)
  cache.set(cacheKey, distance, 3600000) // Cache for 1 hour
  
  return distance
}
```

### 4. Batch Requests

Use table queries for multiple points:

```typescript
// Instead of multiple route queries
const distances = await osrm.calculateDistances(
  [origin],
  [dest1, dest2, dest3, dest4, dest5]
)

// This is much faster than 5 separate route queries
```

## Production Deployment

### Cloud Deployment Options

#### Option 1: Self-Hosted on VPS

Deploy OSRM on a VPS (DigitalOcean, AWS EC2, etc.):

```bash
# On your VPS
git clone <your-repo>
cd <your-repo>

# Setup OSRM
./scripts/setup-osrm.sh

# Start with Docker Compose
docker-compose up -d osrm
```

#### Option 2: Kubernetes

Deploy OSRM on Kubernetes:

```yaml
# osrm-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: osrm-bangladesh
spec:
  replicas: 2
  selector:
    matchLabels:
      app: osrm
  template:
    metadata:
      labels:
        app: osrm
    spec:
      containers:
      - name: osrm
        image: ghcr.io/project-osrm/osrm-backend
        args: ["osrm-routed", "--algorithm", "mld", "/data/bangladesh-latest.osrm"]
        ports:
        - containerPort: 5000
        volumeMounts:
        - name: osrm-data
          mountPath: /data
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
      volumes:
      - name: osrm-data
        persistentVolumeClaim:
          claimName: osrm-data-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: osrm-service
spec:
  selector:
    app: osrm
  ports:
  - port: 5000
    targetPort: 5000
  type: LoadBalancer
```

#### Option 3: Managed OSRM Services

Consider managed services for production:
- [Mapbox Directions API](https://docs.mapbox.com/api/navigation/directions/)
- [GraphHopper](https://www.graphhopper.com/)
- [Valhalla](https://valhalla.github.io/valhalla/)

### Monitoring

Monitor OSRM performance:

```bash
# Check container stats
docker stats osrm-bangladesh

# Check logs
docker logs -f osrm-bangladesh

# Monitor requests
curl http://localhost:5000/health
```

### Backup and Updates

#### Backup OSRM Data

```bash
# Backup processed data
tar -czf osrm-bangladesh-backup.tar.gz ~/osrm-data/bangladesh/
```

#### Update OSM Data

```bash
# Download latest data
cd ~/osrm-data/bangladesh
wget https://download.geofabrik.de/asia/bangladesh-latest.osm.pbf

# Reprocess
docker-compose down
# Run extract, partition, customize steps again
docker-compose up -d
```

**Recommended update frequency:** Weekly or monthly

## Troubleshooting

### Common Issues

#### Issue 1: "Cannot connect to OSRM"

**Symptoms:** Application shows "Using Haversine fallback"

**Solutions:**
```bash
# Check if OSRM is running
docker ps | grep osrm

# Check OSRM logs
docker logs osrm-bangladesh

# Test OSRM endpoint
curl http://localhost:5000/health

# Restart OSRM
docker-compose restart osrm
```

#### Issue 2: "No route found"

**Cause:** Coordinates are not on the road network

**Solution:**
```bash
# Use nearest endpoint to snap to road
curl "http://localhost:5000/nearest/v1/driving/90.4074,23.7806"
```

#### Issue 3: Slow Performance

**Solutions:**
- Increase Docker memory allocation
- Use MLD algorithm instead of CH
- Implement caching in application
- Use batch table queries instead of individual routes

#### Issue 4: High Memory Usage

**Solutions:**
```bash
# Limit Docker memory
docker update --memory="4g" osrm-bangladesh

# Or in docker-compose.yml
services:
  osrm:
    mem_limit: 4g
```

## Related Documentation

- [Database Migration Guide](./DATABASE_MIGRATION_GUIDE.md)
- [Strategy Pattern Implementation](../STRATEGY_PATTERN_IMPLEMENTATION.md)
- [Design Document](../.kiro/specs/threshold-based-route-planning/design.md)
- [OSRM Official Documentation](http://project-osrm.org/)
- [OSM Bangladesh](https://www.openstreetmap.org/relation/184640)
