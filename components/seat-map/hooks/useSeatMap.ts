import { useEffect, useState } from 'react';
import { MapData, Category, Seat, ViewerState } from '../types';
import { fetchVenueMap, subscribeToSeatUpdates, unsubscribeFromSeatUpdates } from '../services';

export const useSeatMap = (planId: string) => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [initialViewerState, setInitialViewerState] = useState<ViewerState | null>(null);

  useEffect(() => {
    fetchMap();

    // This is the channel listener for any changes to the 'seats' table
    const seatsSubscription = subscribeToSeatUpdates(handleRealtimeUpdate);

    // Clean up the subscription when the component unmounts
    return () => {
      unsubscribeFromSeatUpdates(seatsSubscription);
    };
  }, [planId]); // Re-run effect if planId changes

  // This function receives the updated seat object from the database broadcast
  const handleRealtimeUpdate = (updatedSeat: Seat) => {
    // We use the functional update form of useState (prevData) for safety
    setMapData((prevData: MapData | null) => {
      if (!prevData) return prevData;

      // 1. Traverse the map hierarchy (Zones -> Rows) to find the old seat.
      const newZones = prevData.zones.map(zone => ({
        ...zone,
        rows: zone.rows.map(row => ({
          ...row,
          // 2. Map through seats and replace the outdated seat data
          seats: row.seats.map(
            seat =>
              seat.id === updatedSeat.id
                ? { ...seat, ...updatedSeat } // Found it! Merge the new status/booking_id
                : seat // Keep the old seat
          ),
        })),
      }));

      // 3. Return the new state object
      return { ...prevData, zones: newZones };
    });
  };

  // Fetch logic from previous answers...
  const fetchMap = async () => {
    const data = await fetchVenueMap(planId);

    if (!data) return;

    // Create a color and price lookup map for categories
    // Only include categories that are visible
    const categoryMap: Record<string, Category> = {};
    if (data.categories) {
      data.categories.forEach(c => {
        // Only include categories that are marked as visible
        if (c.isVisible !== false) {
          categoryMap[c.name] = {
            color: c.color,
            price: c.price || 0,
          };
        }
      });
    }
    setCategories(categoryMap);

    // Set map data
    setMapData(data);

    // Calculate initial viewer state to center the map
    const viewerWidth = window.innerWidth;
    const viewerHeight = window.innerHeight;

    const scaleX = viewerWidth / data.width;
    const scaleY = viewerHeight / data.height;
    const scale = Math.min(scaleX, scaleY, 0.9); // Use 0.9 instead of 1 to add some padding

    const mapCenterX = data.width / 2;
    const mapCenterY = data.height / 2;

    const translateX = viewerWidth / 2 - mapCenterX * scale;
    const translateY = viewerHeight / 2 - mapCenterY * scale;

    // Set initial viewer state
    setInitialViewerState({
      a: scale,
      b: 0,
      c: 0,
      d: scale,
      e: translateX,
      f: translateY,
    });

    // Mark map as loaded
    setMapLoaded(true);
  };

  return {
    mapData,
    categories,
    mapLoaded,
    initialViewerState,
    refetchMap: fetchMap,
  };
};
