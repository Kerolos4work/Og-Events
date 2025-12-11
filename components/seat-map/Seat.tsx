import React, { useMemo } from 'react';
import { Seat as SeatType, Category as CategoryType } from './types';
import {
  calculateSeatColor,
  calculateSeatBorderColor,
  calculateSeatRadius,
  formatSeatLabel,
  getSeatCursor,
  shouldShowSeatNumber,
  shouldShowCheckmark,
  shouldShowHoldStatus,
} from './utils/seatHelpers';
import { SEAT_SIZE } from './constants';

interface SeatProps {
  seat: SeatType;
  rowNumber: string;
  categories: Record<string, CategoryType>;
  isSelected: boolean;
  onClick: (seat: SeatType) => void;
}

/**
 * HoldStatusAnimation - Animated icon for seats on hold
 */
const HoldStatusAnimation: React.FC<{
  seat: SeatType;
  categoryColor: string;
}> = React.memo(({ seat, categoryColor }) => (
  <g>
    {/* Outer ring */}
    <circle
      cx={seat.position_x}
      cy={seat.position_y}
      r={seat.radius * 0.9}
      fill="none"
      stroke={categoryColor}
      strokeWidth="2"
    />

    {/* Rotating dashed circle */}
    <circle
      cx={seat.position_x}
      cy={seat.position_y}
      r={seat.radius * 0.7}
      fill="none"
      stroke={categoryColor}
      strokeWidth="1.5"
      strokeDasharray={`${seat.radius * 0.7 * Math.PI * 0.2} ${seat.radius * 0.7 * Math.PI * 0.8}`}
      transform={`rotate(0 ${seat.position_x} ${seat.position_y})`}
    >
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        from={`0 ${seat.position_x} ${seat.position_y}`}
        to={`360 ${seat.position_x} ${seat.position_y}`}
        dur="3s"
        repeatCount="indefinite"
      />
    </circle>

    {/* Pulsing inner circle */}
    <circle
      cx={seat.position_x}
      cy={seat.position_y}
      r={seat.radius * 0.3}
      fill="none"
      stroke={categoryColor}
      strokeWidth="1.5"
    >
      <animate
        attributeName="r"
        values={`${seat.radius * 0.3};${seat.radius * 0.4};${seat.radius * 0.3}`}
        dur="2s"
        repeatCount="indefinite"
      />
      <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
    </circle>

    {/* Center dot */}
    <circle cx={seat.position_x} cy={seat.position_y} r={seat.radius * 0.15} fill={categoryColor} />
  </g>
));

HoldStatusAnimation.displayName = 'HoldStatusAnimation';

/**
 * Seat Component - Renders an individual seat with its status
 */
const Seat: React.FC<SeatProps> = ({ seat, rowNumber, categories, isSelected, onClick }) => {
  // Memoize calculated values to avoid recalculation on every render
  const seatColor = useMemo(
    () => calculateSeatColor(seat, isSelected, categories),
    [seat, isSelected, categories]
  );

  const borderColor = useMemo(
    () => calculateSeatBorderColor(seat, isSelected, categories),
    [seat, isSelected, categories]
  );

  const radius = useMemo(() => calculateSeatRadius(seat), [seat]);

  const cursor = useMemo(() => getSeatCursor(seat), [seat.status]);

  const categoryColor = useMemo(
    () => categories[seat.category]?.color || 'black',
    [seat.category, categories]
  );

  const seatLabel = useMemo(
    () => formatSeatLabel(rowNumber, seat.seat_number, seat.category),
    [rowNumber, seat.seat_number, seat.category]
  );

  const handleClick = (e: React.MouseEvent) => {
    if (seat.status === 'available') {
      onClick(seat);
    }
  };
  
  // Track touch start position to detect tap vs pan/zoom
  const touchStartPos = React.useRef<{ x: number; y: number; time: number } | null>(null);
  
  // Handle touch events for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    // Store initial touch position and time
    if (e.touches.length === 1) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }
  };
  
  // Handle touch end to determine if it was a tap or pan/zoom
  const handleTouchEnd = (e: React.TouchEvent) => {
    // Only process if it was a single touch
    if (e.changedTouches.length === 1 && touchStartPos.current) {
      const touchEndPos = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
        time: Date.now()
      };
      
      // Calculate distance and time difference
      const distance = Math.sqrt(
        Math.pow(touchEndPos.x - touchStartPos.current.x, 2) + 
        Math.pow(touchEndPos.y - touchStartPos.current.y, 2)
      );
      const timeDiff = touchEndPos.time - touchStartPos.current.time;
      
      // If it was a quick tap (small distance, short time), select the seat
      if (distance < 10 && timeDiff < 300 && seat.status === 'available') {
        onClick(seat);
      }
      
      // Reset the touch start position
      touchStartPos.current = null;
    }
  };

  return (
    <g key={seat.id}>
      <circle
        cx={seat.position_x}
        cy={seat.position_y}
        r={radius}
        fill={seatColor}
        stroke={borderColor}
        strokeWidth={isSelected ? '1' : '0'}
        cursor={cursor}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'manipulation' }}
      >
        <title>{seatLabel}</title>
      </circle>

      {/* Checkmark for selected seats */}
      {shouldShowCheckmark(isSelected) && (
        <g 
          transform={`translate(${seat.position_x}, ${seat.position_y})`}
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'manipulation', cursor: 'pointer' }}
        >
          <path
            d={`M${-seat.radius * SEAT_SIZE.CHECKMARK_SCALE},${0} L${-seat.radius * 0.15},${seat.radius * 0.3} L${seat.radius * SEAT_SIZE.CHECKMARK_SCALE},${-seat.radius * 0.3}`}
            fill="none"
            stroke={categoryColor}
            strokeWidth={seat.radius * SEAT_SIZE.ICON_SCALE}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* Seat number for unselected available seats */}
      {shouldShowSeatNumber(seat, isSelected) && (
        <text
          x={seat.position_x}
          y={seat.position_y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={seat.radius * SEAT_SIZE.TEXT_SCALE}
          fontWeight="bold"
          pointerEvents="none"
          cursor={cursor}
        >
          {seat.seat_number}
        </text>
      )}

      {/* Hold status animation */}
      {shouldShowHoldStatus(seat) && (
        <HoldStatusAnimation seat={seat} categoryColor={categoryColor} />
      )}
    </g>
  );
};

export default React.memo(Seat);
