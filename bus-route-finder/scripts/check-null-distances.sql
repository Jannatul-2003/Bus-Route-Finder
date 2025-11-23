-- Check the distribution of distance_to_next values
SELECT 
  CASE 
    WHEN distance_to_next IS NULL THEN 'NULL'
    WHEN distance_to_next = 0 THEN 'ZERO'
    WHEN distance_to_next > 0 THEN 'POSITIVE'
    ELSE 'OTHER'
  END as distance_status,
  COUNT(*) as count
FROM route_stops
GROUP BY distance_status
ORDER BY count DESC;

-- Show some examples of segments without distances
SELECT 
  id,
  bus_id,
  stop_id,
  stop_order,
  direction,
  distance_to_next,
  duration_to_next
FROM route_stops
WHERE distance_to_next IS NULL
LIMIT 10;
