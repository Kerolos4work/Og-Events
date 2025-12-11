'use client';

import React from 'react';

// Type definitions for better type safety
interface LegendItem {
  id: string;
  name: string;
  color?: string;
  price?: number;
  type: 'price' | 'status';
}

interface SeatStatus {
  id: string;
  name: string;
  icon: React.ReactNode;
}

// Reusable component for price items
const PriceItem = ({ item, isDarkMode }: { item: LegendItem; isDarkMode: boolean }) => {
  return (
    <div className="flex items-center justify-between group -mx-2 px-1 py-0.5 rounded-md">
      <div className="flex items-center space-x-3">
        <div className="relative w-4 h-4 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 16 16" className="absolute inset-0">
            <circle cx="8" cy="8" r="7" fill={item.color} stroke="transparent" strokeWidth="0" />
            <text
              x="8"
              y="8"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="6"
              fontWeight="bold"
              pointerEvents="none"
            />
          </svg>
        </div>
        <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {item.price}{' '}
          <span className={`text-xs font-normal ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
            EGP
          </span>
        </span>
      </div>
      <span
        className={`text-xs font-normal italic ${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-500'} transition-colors duration-200 opacity-75`}
      >
        {item.name}
      </span>
    </div>
  );
};

// Reusable component for status items
const StatusItem = ({ status, isDarkMode }: { status: SeatStatus; isDarkMode: boolean }) => {
  return (
    <div className="flex items-center justify-between group -mx-2 px-1 py-0.5 rounded-md">
      <div className="flex items-center space-x-3">
        <div className="relative w-4 h-4 flex items-center justify-center">{status.icon}</div>
        <span className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {status.name}
        </span>
      </div>
    </div>
  );
};

// Predefined status items with their icons
const getSeatStatusItems = (): SeatStatus[] => {
  return [
    {
      id: 'booked',
      name: 'Booked',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" className="absolute inset-0">
          <circle cx="8" cy="8" r="3.5" fill="#7F7F7F7f" stroke="#e0e0e0" strokeWidth="0" />
        </svg>
      ),
    },
    {
      id: 'hold',
      name: 'Hold',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" className="absolute inset-0">
          {/* Outer ring */}
          <circle cx="8" cy="8" r="7.2" fill="none" stroke="#444444" strokeWidth="2" />
          {/* Rotating dashed circle */}
          <circle
            cx="8"
            cy="8"
            r="5.6"
            fill="none"
            stroke="#444444"
            strokeWidth="1.5"
            strokeDasharray={`${5.6 * Math.PI * 0.2} ${5.6 * Math.PI * 0.8}`}
            transform={`rotate(0 8 8)`}
          >
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from={`0 8 8`}
              to={`360 8 8`}
              dur="3s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Pulsing inner circle */}
          <circle cx="8" cy="8" r="2.4" fill="none" stroke="#444444" strokeWidth="1.5">
            <animate attributeName="r" values="2.4;3.2;2.4" dur="2s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0.8;0.3;0.8"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Center dot */}
          <circle cx="8" cy="8" r="1.2" fill="#444444" />
        </svg>
      ),
    },
    {
      id: 'selected',
      name: 'Selected',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" className="absolute inset-0">
          <circle cx="8" cy="8" r="7" fill="#4444443d" stroke="#444444" strokeWidth="1" />
          <path
            d={`M${-6 * 0.4},${0} L${-6 * 0.15},${6 * 0.3} L${6 * 0.4},${-6 * 0.3}`}
            fill="none"
            stroke="#444444"
            strokeWidth={6 * 0.15}
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="translate(8, 8)"
          />
        </svg>
      ),
    },
  ];
};

const SeatMapLegendSimple = ({
  isDarkMode,
  legendItems,
  venueName,
  showStatusItems = true,
  isCollapsed: externalIsCollapsed,
}: {
  isDarkMode: boolean;
  legendItems: LegendItem[];
  venueName?: string;
  showStatusItems?: boolean;
  isCollapsed?: boolean;
}) => {
  // Use external isCollapsed state if provided, otherwise use internal state
  const [internalIsCollapsed, setInternalIsCollapsed] = React.useState(false);
  const [autoCollapsed, setAutoCollapsed] = React.useState(false);
  
  // Track if the legend was auto-collapsed
  React.useEffect(() => {
    if (externalIsCollapsed !== undefined && externalIsCollapsed !== internalIsCollapsed) {
      setInternalIsCollapsed(externalIsCollapsed);
      setAutoCollapsed(true);
    }
  }, [externalIsCollapsed]);
  
  // Use the internal state for UI, but allow overriding with external state
  const isCollapsed = internalIsCollapsed;
  
  // Toggle function that allows expanding after auto-collapse
  const handleToggle = () => {
    if (autoCollapsed) {
      setAutoCollapsed(false);
    }
    setInternalIsCollapsed(!isCollapsed);
  };
  const statusItems = getSeatStatusItems();

  return (
    <div
      className={`left-4 top-4 border rounded-xl shadow-xl z-10 transition-all duration-300 flex-grow`}
      style={{
        backgroundColor: isDarkMode ? 'rgb(0 0 0 / 0.6)' : 'rgb(255 255 255 / 0.6)',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(24px)',
      }}
    >
      <div
        onClick={handleToggle}
        className="flex items-center justify-between cursor-pointer p-3 pb-2 pt-2"
      >
        <h2
          className={`text-lg font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
          {venueName || 'Seat Map Legend'}
        </h2>
        <div
          className={`p-1 rounded-full transition-transform duration-300 ${isCollapsed ? 'rotate-90' : ''} ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isDarkMode ? '#ffffff' : '#000000'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>

      <div
        className={`px-5 space-y-4 overflow-hidden transition-all duration-500 ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}
      >
        {/* Price items section */}
        {legendItems.length > 0 && (
          <div key="price-section" className="space-y-2">
            <div className="space-y-1">
              {legendItems.map(item => (
                <PriceItem key={item.id} item={item} isDarkMode={isDarkMode} />
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        {legendItems.length > 0 && showStatusItems && (
          <div key="divider" className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
        )}

        {/* Status items section */}
        {showStatusItems && (
          <div key="status-section" className="space-y-2">
            <div className="space-y-1">
              {statusItems.map(status => (
                <StatusItem key={status.id} status={status} isDarkMode={isDarkMode} />
              ))}
            </div>
          </div>
        )}
        <div key="padding"></div>
      </div>
    </div>
  );
};

export default SeatMapLegendSimple;
