import React, { useRef } from 'react';
import Row from './Row';
import {
  Zone as ZoneType,
  Category as CategoryType,
  Seat as SeatType,
  Area as AreaType,
} from './types';
import { calculateZoneBounds, getZoneColor } from './utils/zoneHelpers';

/**
 * Props for the Zone component
 */
interface ZoneProps {
  /** Zone data containing rows and areas */
  zone: ZoneType;
  /** Seat categories with color and price information */
  categories: Record<string, CategoryType>;
  /** Array of currently selected seat IDs */
  selectedSeats: SeatType[];
  /** Callback function triggered when a seat is clicked */
  onSeatClick: (seat: SeatType) => void;
  /** Current zoom level from the parent component */
  zoomLevel?: number;
  /** Callback function triggered when a zone is clicked */
  onZoneClick?: (zoneId: string) => void;
  /** Flag to indicate if the view is on a mobile device */
  isMobile?: boolean;
  /** Flag to indicate if full map view is active */
  isFullMapView?: boolean;
}

/**
 * Renders an area (e.g., stage) within a zone
 * @param area The area to render
 * @returns JSX element representing the area
 */
const Area: React.FC<{ area: AreaType }> = ({ area }) => {
  const transform = `translate(${area.position_x}, ${area.position_y}) rotate(${area.rotation})`;
  const textX = area.width / 2;
  const textY = area.height / 2;

  return (
    <g key={area.id} transform={transform} className="zone-area">
      <rect
        width={area.width}
        height={area.height}
        fill={area.fill_color}
        stroke="black"
        className="area-rect"
      />
      <text
        x={textX}
        y={textY}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="black"
        className="area-text"
      >
        {area.text_content}
      </text>
    </g>
  );
};

/**
 * Zone component that renders rows and areas (like stage) in a theater zone
 *
 * @param {ZoneProps} props - Component props
 * @returns {JSX.Element} SVG group element containing rows and areas
 */
const Zone: React.FC<ZoneProps> = ({
  zone,
  categories,
  selectedSeats,
  onSeatClick,
  zoomLevel = 1,
  onZoneClick,
  isMobile = false,
  isFullMapView = true,
}) => {
  // Ref to store pointer down event details to distinguish pan from tap
  const pointerDownRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Calculate the bounds of all seats in the zone
  const { minX, minY, maxX, maxY, hasSeats } = calculateZoneBounds(zone);

  // Get the zone color based on the most common seat category
  const zoneColor = getZoneColor(zone, categories);

  // Calculate padding for the rectangle (2% of the zone size for tighter fit)
  const paddingX = (maxX - minX) * 0.02;
  const paddingY = (maxY - minY) * 0.02;

  // Calculate rectangle opacity based on zoom level
  let rectOpacity = 0.8; // Default opacity

  if (!isMobile) {
    if (zoomLevel >= 2.3) {
      rectOpacity = 0;
    } else if (zoomLevel > 1) {
      // Linear interpolation between opacity 0.8 at zoom=1 and opacity 0 at zoom=2.3
      rectOpacity = 0.8 * (1 - (zoomLevel - 1) / 1.3);
    }
  } else {
    // On mobile, only show zone rectangles when in full map view
    rectOpacity = isFullMapView ? 0.8 : 0;
  }

  // Calculate text opacity based on rectangle opacity
  const textOpacity = rectOpacity > 0 ? 1 : 0;

  // Determine if seats should be selectable based on rectangle opacity
  const seatsSelectable = rectOpacity < 0.3 || !hasSeats;

  // Don't render the zone rectangle and text when opacity is 0
  const shouldRenderZone = hasSeats && rectOpacity > 0;

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerDownRef.current) {
      const { x, y, time } = pointerDownRef.current;
      const deltaX = Math.abs(e.clientX - x);
      const deltaY = Math.abs(e.clientY - y);
      const deltaTime = Date.now() - time;

      // Thresholds for movement and time to detect a tap
      const distanceThreshold = 10; // 10 pixels
      const timeThreshold = 300; // 300 ms

      if (deltaX < distanceThreshold && deltaY < distanceThreshold && deltaTime < timeThreshold) {
        // It's a tap, so trigger the zone click
        if (onZoneClick) {
          onZoneClick(zone.id);

          // On mobile, hide all zone rectangles when a zone is clicked
          if (isMobile) {
            // Dispatch a custom event to notify the parent component
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('zoneClicked');
              window.dispatchEvent(event);

              // Set a flag to prevent seat selection for a short time after zone click
              (window as any).__preventSeatSelectionUntil = Date.now() + 500; // 500ms
            }
          }
        }

        // Prevent the event from propagating to seat elements
        e.stopPropagation();
        e.preventDefault();
      }
      // Reset the ref after processing
      pointerDownRef.current = null;
    }
  };

  // Handle click events for PC users
  const handleClick = (e: React.MouseEvent) => {
    // Trigger the zone click
    if (onZoneClick) {
      onZoneClick(zone.id);
    }

    // Prevent the event from propagating to seat elements
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <React.Fragment>
      {/* Main zone group with all elements */}
      <g
        key={zone.id}
        transform={`translate(${zone.position_x}, ${zone.position_y})`}
        className="seat-zone"
        data-zone-name={zone.name}
      >
        {/* Render areas (e.g., stage) */}
        {zone.areas && zone.areas.map(area => <Area key={area.id} area={area} />)}

        {/* Render rows of seats */}
        {zone.rows.map(row => (
          <Row
            key={row.id}
            row={row}
            categories={categories}
            selectedSeats={selectedSeats}
            onSeatClick={seatsSelectable ? onSeatClick : () => {}}
          />
        ))}

        {/* Zone rectangle for visual enhancement */}
        {shouldRenderZone && (
          <g
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x={minX - paddingX}
              y={minY - paddingY}
              width={maxX - minX + paddingX * 2}
              height={maxY - minY + paddingY * 2}
              fill={zoneColor}
              fillOpacity={rectOpacity * 0.8}
              stroke={zoneColor}
              strokeWidth="2"
              strokeOpacity={rectOpacity}
              rx="8"
              ry="8"
              className="zone-rect"
              style={{ pointerEvents: 'auto' }}
              onClick={handleClick}
            />
            <text
              x={(minX + maxX) / 2}
              y={(minY + maxY) / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={Math.max(18, (maxX - minX) / 7)}
              fontWeight="900"
              opacity={textOpacity}
              pointerEvents="none"
            >
              {zone.name}
            </text>
          </g>
        )}
      </g>
    </React.Fragment>
  );
};

export default Zone;
