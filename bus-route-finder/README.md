# Dhaka Bus Route Planning System

A modern, accessible web application for finding optimal bus routes in Dhaka city. Users can discover bus stops within configurable threshold distances, select onboarding/offboarding stops, and filter buses by amenities (AC/Non-AC, coach type).

## Features

- 🎯 **Threshold-Based Stop Discovery** - Find stops within 100m to 5000m of your location
- 🗺️ **OSRM Integration** - Accurate road-network distance calculations
- 🚌 **Smart Bus Filtering** - Filter by AC/Non-AC, coach type (Standard/Express/Luxury)
- 📊 **Journey Calculations** - Pre-calculated distances and time estimates
- 🎨 **Modern UI** - Clean, responsive design with dark mode support
- ♿ **Accessible** - WCAG AA compliant with full keyboard navigation
- 🚀 **Performance Optimized** - Caching, memoization, and virtualization

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OSRM server (optional, falls back to Haversine)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   OSRM_BASE_URL=http://localhost:5000  # Optional
   ```

4. **Setup database**
   
   Follow the [Database Migration Guide](docs/DATABASE_MIGRATION_GUIDE.md) to:
   - Run database migrations
   - Populate seed data

5. **Setup OSRM (Optional)**
   
   Follow the [OSRM Setup Guide](docs/OSRM_SETUP.md) for accurate distance calculations.
   
   If OSRM is not available, the system automatically falls back to Haversine distance calculation.

6. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Documentation

### Getting Started
- [Database Migration Guide](docs/DATABASE_MIGRATION_GUIDE.md) - Database setup and migrations
- [OSRM Setup Guide](docs/OSRM_SETUP.md) - Distance calculation service setup

### Architecture & Patterns
- [BusFilterBuilder Documentation](docs/BUS_FILTER_BUILDER.md) - Builder pattern for filtering
- [Decorator Pattern Documentation](docs/DECORATOR_PATTERN.md) - Result enhancement pattern
- [Strategy Pattern](STRATEGY_PATTERN_IMPLEMENTATION.md) - Distance calculation strategies
- [Observer Pattern](OBSERVER_README.md) - State management

### API & Implementation
- [API Routes Implementation](API_ROUTES_IMPLEMENTATION.md) - REST API endpoints
- [Error Handling](ERROR_HANDLING_IMPLEMENTATION.md) - Error handling strategies
- [Performance Optimizations](PERFORMANCE_OPTIMIZATIONS.md) - Performance improvements

### Specifications
- [Requirements Document](.kiro/specs/threshold-based-route-planning/requirements.md) - System requirements
- [Design Document](.kiro/specs/threshold-based-route-planning/design.md) - Technical design
- [Implementation Tasks](.kiro/specs/threshold-based-route-planning/tasks.md) - Development tasks

### Complete Documentation
See [docs/README.md](docs/README.md) for the complete documentation index.

## Technology Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **State Management:** Zustand (Observer Pattern)
- **Database:** Supabase (PostgreSQL)
- **Maps:** Leaflet / React-Leaflet
- **Distance Calculation:** OSRM with Haversine fallback
- **Testing:** Vitest, React Testing Library, fast-check (Property-Based Testing)
- **UI Components:** shadcn/ui

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server

# Testing
npm test             # Run all tests
npm test -- --watch  # Run tests in watch mode
npm test -- <file>   # Run specific test file

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

### Project Structure

```
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── api/            # API routes
│   │   └── route-planner/  # Route planner page
│   ├── components/         # React components
│   ├── lib/
│   │   ├── builders/       # Builder pattern (BusFilterBuilder)
│   │   ├── decorators/     # Decorator pattern (EnhancedBusResult)
│   │   ├── services/       # Business logic services
│   │   ├── strategies/     # Strategy pattern (Distance calculation)
│   │   ├── stores/         # Zustand stores
│   │   └── supabase/       # Supabase client
│   └── hooks/              # Custom React hooks
├── supabase/
│   ├── migrations/         # Database migrations
│   └── seeds/              # Seed data
├── docs/                   # Documentation
└── scripts/                # Utility scripts
```

## Design Patterns

This project demonstrates several design patterns:

1. **Strategy Pattern** - Distance calculation (OSRM vs Haversine)
2. **Decorator Pattern** - Enhancing bus results with computed properties
3. **Builder Pattern** - Constructing complex filter queries
4. **Observer Pattern** - Reactive state management with Zustand
5. **Singleton Pattern** - Supabase client management

See [docs/README.md](docs/README.md) for detailed pattern documentation.

## Testing

The project uses a comprehensive testing strategy:

- **Unit Tests** - Individual functions and components
- **Integration Tests** - Service interactions
- **Property-Based Tests** - Universal properties with fast-check
- **Component Tests** - React component behavior

Run tests:
```bash
npm test
```

See [TEST_JUSTIFICATION.md](TEST_JUSTIFICATION.md) for testing rationale.

## Accessibility

The application follows WCAG AA standards:
- Full keyboard navigation support
- Screen reader compatible with ARIA labels
- Color contrast compliance
- Focus indicators on all interactive elements

See [ACCESSIBILITY.md](ACCESSIBILITY.md) for details.

## Performance

Performance optimizations include:
- Caching of stop data and distance calculations
- Memoization of journey length calculations
- Debouncing of user inputs (300ms)
- Virtualization of long lists
- Lazy loading of map component
- Optimized database queries with indexes

See [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Follow conventional commits and include tests for new features.

## License

[Add your license information here]

## Support

For issues and questions:
- Check the [documentation](docs/README.md)
- Review [error handling guide](ERROR_HANDLING_IMPLEMENTATION.md)
- Create an issue with reproduction steps

## Acknowledgments

- [Next.js](https://nextjs.org) - React framework
- [Supabase](https://supabase.com) - Backend platform
- [OSRM](http://project-osrm.org/) - Routing engine
- [OpenStreetMap](https://www.openstreetmap.org) - Map data
- [shadcn/ui](https://ui.shadcn.com/) - UI components
