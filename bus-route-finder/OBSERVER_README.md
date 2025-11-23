# Observer Pattern in Bus Route Finder

This document explains how the Observer pattern is applied in the route planner feature so you can quickly understand or extend it.

## High-level flow

1. `Observable` (in `src/lib/observer.ts`) provides `subscribe`, `unsubscribe`, and `notify`.
2. `RoutePlannerStore` (in `src/lib/stores/routePlannerStore.ts`) extends `Observable` and owns all route-planning state plus async logic (API requests, geolocation, derived data).
3. `useRoutePlanner` hook (`src/hooks/useRoutePlanner.ts`) subscribes React components to the store and exposes stable action methods.
4. `RoutePlanner` page (`src/app/page.tsx`) consumes the hook. UI triggers store actions; store updates state; observers get notified; the component re-renders with the latest state.

```
UI (page.tsx) → actions (hook) → store updates → notify observers → React state update → UI rerender
```

## Key pieces

### Observable helper (`src/lib/observer.ts`)
```ts
export interface Observer<T> {
  update(state: T): void
}

export class Observable<T> {
  #observers = new Set<Observer<T>>()
  subscribe(observer: Observer<T>) { this.#observers.add(observer) }
  unsubscribe(observer: Observer<T>) { this.#observers.delete(observer) }
  protected notify(state: T) {
    this.#observers.forEach((observer) => observer.update(state))
  }
}
```

### Store (`src/lib/stores/routePlannerStore.ts`)
- Extends `Observable<RoutePlannerState>`.
- Holds everything previously in `app/page.tsx`: form inputs, map data, search results, planned route, loading flags, errors.
- Each mutation uses a private `#setState` that merges updates then calls `notify(newState)`.
- Public methods serve as the API:
  - `setFromLocation`, `setToLocation`
  - `handleGetLocation`
  - `searchRoutes`
  - `selectResult`
  - `ensureInitialized` (fetches active buses once)

Because the entire snapshot is emitted on every change, observers always receive the latest state.

### Hook (`src/hooks/useRoutePlanner.ts`)
- Maintains local React state initialized from `routePlannerStore.getState()`.
- On mount:
  - Creates an observer `{ update: (nextState) => setState(nextState) }`.
  - Subscribes to the store.
  - Calls `ensureInitialized()` to kick off data fetching.
- On unmount:
  - Unsubscribes to avoid memory leaks.
- Returns `{ state, actions }`, where `actions` simply call the store’s public methods.

### Page (`src/app/page.tsx`)
- Pulls data and actions from `useRoutePlanner`.
- Inputs call `setFromLocation`, `setToLocation`, etc.
- “Find Routes” button calls `searchRoutes`.
- Clicking a result triggers `selectResult`.
- All UI renders directly from observer-backed state (`searchResults`, `mapStops`, `plannedRoute`, `error`, etc.).

## Benefits
- **Single source of truth**: All route-planner logic and state live in the store.
- **Decoupled components**: Any component can subscribe via the hook (or its own observer) without duplicating logic.
- **Consistency**: Observer ensures every subscriber reacts instantly to state changes.
- **Testability**: Store methods can be unit-tested apart from React.

## Extending the pattern
- Need another feature reacting to route-planner state? Subscribe to `routePlannerStore` directly or reuse the hook.
- Add new actions/state by updating `RoutePlannerStore` only; UI layers automatically receive the new data.
- Want a different observable domain? Create another store extending `Observable` and follow the same hook pattern.

That’s it—you now have a shared observer-backed store driving the entire route planner UI.

