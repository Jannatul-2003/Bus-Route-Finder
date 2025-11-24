# Bug Fixes Summary

## Issues Fixed

### 1. Database Update for Calculated Distances ✅

**Problem**: When `distance_to_next` was missing from the database and OSRM/Haversine calculated it, the database wasn't being updated. The logs showed "Database should be updated" but no actual update occurred.

**Solution**: Modified `BusRouteService.ts` to automatically update the database **only when OSRM successfully calculates** the distance (not when using Haversine fallback):

```typescript
const calculatedDistance = distances[0][0].distance
const calculationMethod = distances[0][0].method
totalDistance += calculatedDistance

// Only update database if OSRM was used (not Haversine fallback)
if (calculationMethod === 'OSRM') {
  try {
    const { error: updateError } = await this.supabaseClient
      .from('route_stops')
      .update({ distance_to_next: calculatedDistance })
      .eq('bus_id', busId)
      .eq('direction', direction)
      .eq('stop_order', segment.stop_order)
    
    if (updateError) {
      console.error(`Failed to update distance_to_next in database`)
    } else {
      console.log(`Successfully updated distance_to_next (OSRM calculated)`)
    }
  } catch (updateErr) {
    console.error(`Error updating distance_to_next: `, updateErr)
  }
} else {
  console.log(`Skipping database update (used ${calculationMethod} fallback, not OSRM)`)
}
```

**Benefits**:
- Database is populated only with accurate OSRM-calculated distances
- Haversine fallback values are used for display but not persisted
- Ensures database contains high-quality routing data
- Future queries will be faster when OSRM data is available
- Reduces load on OSRM service over time
- Improves data completeness with accurate distances

**File Modified**: `src/lib/services/BusRouteService.ts`

---

### 2. Filter Card Visibility Fix ✅

**Problem**: When filtering by AC/non-AC or coach type resulted in zero buses, the entire filter card would disappear. This made it impossible to adjust or clear filters, creating a poor user experience where users got "stuck" with no way to see or modify their filters.

**Solution**: Changed the visibility logic to show the filter card whenever ANY buses are found (before filtering), not just when buses remain after filtering:

1. **Changed section visibility condition** in `src/app/page.tsx`:
   ```typescript
   // Before: Only show when filtered results exist
   {state.availableBuses.length > 0 && (
     <div>Filter Controls + Results</div>
   )}
   
   // After: Show when any buses exist (before filtering)
   {state.allBuses.length > 0 && (
     <div>Filter Controls + Results</div>
   )}
   ```

2. **Added "No matches" state** within the bus results section:
   - When `state.availableBuses.length === 0` but `state.allBuses.length > 0`
   - Shows a helpful message: "X bus(es) found, but none match your current filter settings"
   - Suggests adjusting or clearing filters
   - Filter controls remain visible and functional

3. **Updated bus count display**:
   ```typescript
   Showing {state.availableBuses.length} of {state.allBuses.length} bus(es)
   ```

**Benefits**:
- Filter card always visible when buses exist
- Users can always adjust filters, even when no matches
- Clear distinction between "no buses found" vs "no buses match filters"
- Better UX - no dead ends where users can't modify filters
- Clicking active filter buttons still toggles them off individually

**Files Modified**:
- `src/app/page.tsx`

---

## Testing Recommendations

### Test Case 1: Database Updates (OSRM Only)
1. **With OSRM running** (http://localhost:5000):
   - Search for a route between "Amin Bazar" and "Shyamoli"
   - Check browser console for messages like:
     - `[BusRouteService] Missing distance_to_next for bus...`
     - `[BusRouteService] Calculated missing distance: X.XXX km using OSRM`
     - `[BusRouteService] Successfully updated distance_to_next in database (OSRM calculated)`
   - Refresh the page and search again - should see fewer "Missing distance_to_next" messages
   - Verify in Supabase that `route_stops` table has updated `distance_to_next` values

2. **Without OSRM running** (fallback to Haversine):
   - Search for a route between "Amin Bazar" and "Shyamoli"
   - Check browser console for messages like:
     - `[BusRouteService] Missing distance_to_next for bus...`
     - `[BusRouteService] Calculated missing distance: X.XXX km using Haversine`
     - `[BusRouteService] Skipping database update (used Haversine fallback, not OSRM)`
   - Refresh and search again - should still see "Missing distance_to_next" messages (no database update)
   - Verify in Supabase that `route_stops` table has NOT been updated with Haversine values

### Test Case 2: Filter Card Visibility
1. Search for buses between two stops (e.g., "Amin Bazar" to "Shyamoli")
2. Verify filter card is visible with all buses shown
3. Apply a filter that eliminates all buses:
   - If all buses are AC, click "Non-AC" button
   - Or select "Luxury" if no luxury buses exist
4. **Verify filter card remains visible** (this was the bug - it used to disappear)
5. Verify message shows: "X bus(es) found, but none match your current filter settings"
6. Verify you can still see and click filter buttons
7. Click the active filter button to toggle it off
8. Verify buses reappear
9. Test with multiple filters active
10. Verify count shows "Showing X of Y bus(es)"

---

## Notes

- **Database updates only happen with OSRM**: Haversine fallback values are used for display only
- The database update is wrapped in try-catch to prevent failures from breaking the search
- If database update fails, it logs an error but continues showing results
- The calculation method is checked before updating: `if (calculationMethod === 'OSRM')`
- The filter cache is cleared when filters are reset to ensure fresh results
- All changes maintain backward compatibility
- No breaking changes to existing APIs

## Why OSRM-only Updates?

OSRM provides accurate road-based routing distances, while Haversine calculates straight-line ("as the crow flies") distances. By only persisting OSRM data:
- Database contains realistic travel distances
- Haversine serves as a temporary fallback when OSRM is unavailable
- Data quality remains high
- Users see results even when OSRM is down, but database isn't polluted with inaccurate data
