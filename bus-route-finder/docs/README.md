# Dhaka Bus Route Planning System - Documentation

## Overview

Welcome to the documentation for the Dhaka Bus Route Planning System. This system helps users find optimal bus routes in Dhaka city by discovering stops within configurable threshold distances, selecting onboarding/offboarding stops, and filtering buses by amenities.

## Table of Contents

### Getting Started
- [Main README](../README.md) - Project setup and quick start
- [Database Migration Guide](./DATABASE_MIGRATION_GUIDE.md) - Setting up the database
- [OSRM Setup Guide](./OSRM_SETUP.md) - Configuring distance calculation service

### Architecture & Design Patterns
- [BusFilterBuilder Documentation](./BUS_FILTER_BUILDER.md) - Builder pattern for bus filtering
- [Decorator Pattern Documentation](./DECORATOR_PATTERN.md) - Enhancing bus results
- [Strategy Pattern](../STRATEGY_PATTERN_IMPLEMENTATION.md) - Distance calculation strategies
- [Observer Pattern](../OBSERVER_README.md) - State management

### API & Services
- [API Routes Implementation](../API_ROUTES_IMPLEMENTATION.md) - REST API endpoints
- [Error Handling](../ERROR_HANDLING_IMPLEMENTATION.md) - Error handling strategies
- [Performance Optimizations](../PERFORMANCE_OPTIMIZATIONS.md) - Performance improvements

### Specifications
- [Requirements Document](../.kiro/specs/threshold-based-route-planning/requirements.md) - System requirements
- [Design Document](../.kiro/specs/threshold-based-route-planning/design.md) - Technical design
- [Implementation Tasks](../.kiro/specs/threshold-based-route-planning/tasks.md) - Development tasks

### Testing
- [Test Justification](../TEST_JUSTIFICATION.md) - Testing strategy and rationale

## Quick Links

### For Developers

**Setting Up Development Environment:**
1. [Database Migration Guide](./DATABASE_MIGRATION_GUIDE.md) - Set up database schema
2. [OSRM Setup Guide](./OSRM_SETUP.md) - Configure distance calculation
3. [Main README](../README.md) - Install dependencies and run dev server

**Understanding the Codebase:**
1. [Design Document](../.kiro/specs/threshold-based-route-planning/design.md) - System architecture
2. [BusFilterBuilder](./BUS_FILTER_BUILDER.md) - Filtering implementation
3. [Decorator Pattern](./DECORATOR_PATTERN.md) - Result enhancement
4. [API Routes](../API_ROUTES_IMPLEMENTATION.md) - Backend endpoints

**Testing:**
1. [Test Justification](../TEST_JUSTIFICATION.md) - Testing approach
2. Run tests: `npm test`
3. Run specific test: `npm test -- <test-file>`

### For System Administrators

**Deployment:**
1. [Database Migration Guide](./DATABASE_MIGRATION_GUIDE.md) - Production database setup
2. [OSRM Setup Guide](./OSRM_SETUP.md) - Production OSRM deployment
3. [Performance Optimizations](../PERFORMANCE_OPTIMIZATIONS.md) - Optimization strategies

**Maintenance:**
1. [Database Migration Guide](./DATABASE_MIGRATION_GUIDE.md#maintenance) - Database maintenance
2. [OSRM Setup Guide](./OSRM_SETUP.md#backup-and-updates) - OSRM updates
3. [Error Handling](../ERROR_HANDLING_IMPLEMENTATION.md) - Troubleshooting

### For Product Managers

**Understanding Features:**
1. [Requirements Document](../.kiro/specs/threshold-based-route-planning/requirements.md) - Feature requirements
2. [Design Document](../.kiro/specs/threshold-based-route-planning/design.md) - Feature design
3. [Implementation Tasks](../.kiro/specs/threshold-based-route-planning/tasks.md) - Development progress

## Key Features

### 1. Threshold-Based Stop Discovery
Users can configure search thresholds (100m - 5000m) for both starting and destination locations. The system uses OSRM for accurate road-network distances.

**Documentation:**
- [Requirements 1.1-1.5](../.kiro/specs/threshold-based-route-planning/requirements.md#requirement-1-threshold-configuration)
- [Requirements 2.1-2.5](../.kiro/specs/threshold-based-route-planning/requirements.md#requirement-2-stop-discovery-using-osrm)

### 2. Stop Selection Interface
Users can select onboarding and offboarding stops from discovered stops, with calculated walking distances displayed.

**Documentation:**
- [Requirements 3.1-3.6](../.kiro/specs/threshold-based-route-planning/requirements.md#requirement-3-stop-selection-interface)

### 3. Bus Route Retrieval
The system finds all buses that travel between selected stops in the correct order, with journey length calculations.

**Documentation:**
- [Requirements 4.1-4.5](../.kiro/specs/threshold-based-route-planning/requirements.md#requirement-4-bus-route-retrieval)
- [Requirements 5.1-5.5](../.kiro/specs/threshold-based-route-planning/requirements.md#requirement-5-journey-length-calculation)

### 4. Advanced Filtering & Sorting
Users can filter buses by AC/Non-AC, coach type (Standard/Express/Luxury), and sort by journey length or estimated time.

**Documentation:**
- [Requirements 6.1-6.7](../.kiro/specs/threshold-based-route-planning/requirements.md#requirement-6-bus-filtering-and-sorting)
- [BusFilterBuilder Documentation](./BUS_FILTER_BUILDER.md)

### 5. Route Visualization
Interactive map showing discovered stops, selected route, and walking paths.

**Documentation:**
- [Requirements 10.1-10.5](../.kiro/specs/threshold-based-route-planning/requirements.md#requirement-10-route-visualization)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  - Next.js App Router                                        │
│  - React Components (StopSelectionCard, BusResultCard, etc.)│
│  - Zustand Store (State Management)                         │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                 Business Logic Layer                         │
│  - StopDiscoveryService (Stop finding)                      │
│  - BusRouteService (Route queries)                          │
│  - BusFilterBuilder (Filtering - Builder Pattern)           │
│  - EnhancedBusResultFactory (Enhancement - Decorator)       │
│  - DistanceCalculator (Distance calc - Strategy Pattern)    │
└─────────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────────┐
│                 Data Access Layer                            │
│  - Supabase Client (Database)                               │
│  - OSRM Service (Distance calculation)                      │
└─────────────────────────────────────────────────────────────┘
```

**Learn more:**
- [Design Document - Architecture](../.kiro/specs/threshold-based-route-planning/design.md#architecture)

## Design Patterns Used

### 1. Strategy Pattern
Used for distance calculation with OSRM and Haversine strategies.

**Documentation:** [Strategy Pattern Implementation](../STRATEGY_PATTERN_IMPLEMENTATION.md)

### 2. Decorator Pattern
Used for enhancing bus results with computed properties (journey length, walking distances, time estimates).

**Documentation:** [Decorator Pattern Documentation](./DECORATOR_PATTERN.md)

### 3. Builder Pattern
Used for constructing complex bus filter queries with a fluent interface.

**Documentation:** [BusFilterBuilder Documentation](./BUS_FILTER_BUILDER.md)

### 4. Observer Pattern
Used for reactive state management in the route planner store.

**Documentation:** [Observer Pattern README](../OBSERVER_README.md)

### 5. Singleton Pattern
Used for Supabase client management.

**Code:** `src/lib/supabase/SupabaseClientSingleton.ts`

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Maps:** Leaflet / React-Leaflet
- **UI Components:** shadcn/ui

### Backend
- **Database:** Supabase (PostgreSQL)
- **API:** Next.js API Routes
- **Distance Calculation:** OSRM (Open Source Routing Machine)
- **Authentication:** Supabase Auth

### Testing
- **Framework:** Vitest
- **Testing Library:** React Testing Library
- **Property-Based Testing:** fast-check

### Development Tools
- **Language:** TypeScript
- **Package Manager:** npm
- **Linting:** ESLint
- **Formatting:** Prettier (via ESLint)

## Development Workflow

### 1. Setup
```bash
# Clone repository
git clone <repository-url>
cd <project-directory>

# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase and OSRM URLs

# Run database migrations
# See Database Migration Guide

# Setup OSRM
# See OSRM Setup Guide
```

### 2. Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- src/lib/services/__tests__/BusRouteService.test.ts

# Type checking
npm run type-check

# Linting
npm run lint
```

### 3. Building
```bash
# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Stop Discovery
- `GET /api/stops/within-threshold` - Find stops within threshold
- `GET /api/stops/search` - Search stops by name

### Bus Routes
- `GET /api/buses/between-stops` - Find buses between two stops
- `GET /api/buses` - Get all buses
- `GET /api/buses/[id]` - Get specific bus

### User Settings
- `GET /api/user-settings` - Get user preferences
- `POST /api/user-settings` - Update user preferences

**Full documentation:** [API Routes Implementation](../API_ROUTES_IMPLEMENTATION.md)

## Database Schema

### Tables
- **stops** - Bus stops with coordinates
- **buses** - Bus information with amenities
- **route_stops** - Route definitions with distances

**Full schema:** [Database Migration Guide](./DATABASE_MIGRATION_GUIDE.md)

## Testing Strategy

The project uses a comprehensive testing approach:

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test service interactions
3. **Property-Based Tests** - Test universal properties across many inputs
4. **Component Tests** - Test React components

**Learn more:** [Test Justification](../TEST_JUSTIFICATION.md)

## Performance Optimizations

- **Caching:** Stop data and distance calculations
- **Memoization:** Journey length calculations
- **Debouncing:** Threshold input changes (300ms)
- **Virtualization:** Long stop lists (react-window)
- **Lazy Loading:** Map component
- **Database Indexes:** Optimized queries

**Full details:** [Performance Optimizations](../PERFORMANCE_OPTIMIZATIONS.md)

## Error Handling

The system implements comprehensive error handling:

- **OSRM Timeout:** 30 seconds with Haversine fallback
- **Database Retries:** 3 attempts with exponential backoff
- **Validation:** Input validation for all user inputs
- **Error Boundaries:** React error boundaries for component errors

**Full details:** [Error Handling Implementation](../ERROR_HANDLING_IMPLEMENTATION.md)

## Accessibility

The system follows WCAG AA standards:

- **Keyboard Navigation:** Full keyboard support
- **Screen Readers:** ARIA labels and announcements
- **Color Contrast:** Meets WCAG AA standards
- **Focus Indicators:** Visible focus states

**Full details:** [Accessibility Documentation](../ACCESSIBILITY.md)

## Contributing

### Code Style
- Follow TypeScript best practices
- Use ESLint configuration
- Write tests for new features
- Document public APIs with JSDoc

### Commit Messages
Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test changes
- `refactor:` Code refactoring
- `perf:` Performance improvements

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation
4. Submit PR with description
5. Address review comments
6. Merge after approval

## Support

### Documentation Issues
If you find issues with documentation:
1. Check existing documentation files
2. Search for related topics
3. Create an issue with details

### Technical Issues
For technical problems:
1. Check [Error Handling](../ERROR_HANDLING_IMPLEMENTATION.md)
2. Review relevant documentation
3. Check logs and error messages
4. Create an issue with reproduction steps

## License

[Add your license information here]

## Changelog

See [Implementation Tasks](../.kiro/specs/threshold-based-route-planning/tasks.md) for development progress and completed features.

---

**Last Updated:** 2024
**Version:** 1.0.0
