'use client';

import React, { useState } from 'react';
import { UncontrolledReactSVGPanZoom } from 'react-svg-pan-zoom';
import SeatMapLegendSimple from './legend';
import ThemeToggle from './ThemeToggle';
import FullMapButton from './FullMapButton';
// import { QRScannerButton } from './QRScannerButton';
import SVGPatterns from './SVGPatterns';
import Zone from './Zone';
import { calculateZoneBounds } from './utils/zoneHelpers';
import BookingForm from './BookingForm';
import { useSeatMap, useSeatSelection, useUIState } from './hooks';
import { LegendItem, GuestForm } from './types';
import Notification from '../booking/Notifications';

interface SeatMapFloatProps {
  planId: string;
}

const SeatMapFloat: React.FC<SeatMapFloatProps> = ({ planId }) => {
  // Initialize hooks
  const Viewer = React.useRef<any>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  // State to track if the legend should be collapsed on mobile
  const [legendCollapsed, setLegendCollapsed] = React.useState(false);
  const [touchDetected, setTouchDetected] = React.useState(false);

  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
    isVisible: boolean;
  }>({
    type: 'success',
    message: '',
    isVisible: false,
  });

  // Map data and viewer state
  const { mapData, categories, initialViewerState, refetchMap } = useSeatMap(planId);

  // UI state
  const { isDarkMode, toggleDarkMode } = useUIState();

  // Seat selection and booking
  const {
    selectedSeats,
    isBookingLoading,
    handleSeatClick: handleSeatClickRaw,
    handleRemoveSeat,
    handleClearAll,
    handleBookingSubmit: handleBookingSubmitRaw,
  } = useSeatSelection(refetchMap, categories);

  // Wrap handleSeatClick to show notifications for errors
  const handleSeatClick = React.useCallback(
    (seat: any) => {
      const result = handleSeatClickRaw(seat);
      if (!result.success && result.error) {
        setNotification({
          type: 'error',
          message: result.error,
          isVisible: true,
        });
      }
    },
    [handleSeatClickRaw]
  );

  // Wrap handleBookingSubmit to show notifications
  const handleBookingSubmit = React.useCallback(
    async (formData: GuestForm) => {
      const result = await handleBookingSubmitRaw(formData);
      if (result.success) {
        setNotification({
          type: 'success',
          message:
            'Seats held for 60 minutes. Please upload payment proof to complete your booking.',
          isVisible: true,
        });
      } else if (result.error) {
        setNotification({
          type: 'error',
          message: result.error,
          isVisible: true,
        });
      }
    },
    [handleBookingSubmitRaw]
  );

  // Set window dimensions on mount and resize
  React.useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle first touch on mobile to collapse the legend
  React.useEffect(() => {
    const handleFirstTouch = () => {
      // Check if it's a mobile device (using touch detection)
      if (window.innerWidth <= 768 && !touchDetected) {
        setTouchDetected(true);
        setLegendCollapsed(true);
      }
    };

    // Add touch event listener to the document
    document.addEventListener('touchstart', handleFirstTouch, { once: true });

    return () => {
      document.removeEventListener('touchstart', handleFirstTouch);
    };
  }, [touchDetected]);

  // Track if this is a full page load (not a fast reload)
  const [isFullPageLoad, setIsFullPageLoad] = React.useState(true);

  // Auto-fit and center map only on full page load
  React.useEffect(() => {
    // Only center on full page load, not on every render or dimension change
    if (isFullPageLoad && mapData && Viewer.current && dimensions.width > 0) {
      // Small delay to ensure the viewer is fully initialized
      setTimeout(() => {
        if (Viewer.current && mapData) {
          const scaleX = dimensions.width / mapData.width;
          const scaleY = dimensions.height / mapData.height;
          const scale = Math.min(scaleX, scaleY) * 0.95; // 95% fit to leave some padding

          Viewer.current.setPointOnViewerCenter(mapData.width / 2, mapData.height / 2, scale);
          // Set the initial zoom level state
          setZoomLevel(scale);
          // After centering once, mark as not a full page load anymore
          setIsFullPageLoad(false);
        }
      }, 100);
    }
  }, [isFullPageLoad, mapData]);

  // Handle map viewer controls
  const handleFitToViewer = () => {
    if (Viewer.current && mapData && dimensions.width > 0) {
      const scaleX = dimensions.width / mapData.width;
      const scaleY = dimensions.height / mapData.height;
      const scale = Math.min(scaleX, scaleY) * 0.95;

      Viewer.current.setPointOnViewerCenter(mapData.width / 2, mapData.height / 2, scale);
      // Update the zoom level state to make zone rectangles visible
      setZoomLevel(scale);
      // Set full map view as active
      setIsFullMapView(true);
    }
  };

  // Prevent default zoom and double-click behaviors
  const preventDefault = (e: any) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    return false;
  };

  // Store current zoom level
  const [zoomLevel, setZoomLevel] = React.useState(1);
  // Store reference to the viewer component
  const viewerRef = React.useRef<any>(null);
  // Track if full map view is active
  const [isFullMapView, setIsFullMapView] = React.useState(true);

  // Listen for zone click events on mobile
  React.useEffect(() => {
    const handleZoneClick = () => {
      if (dimensions.width <= 768) {
        setIsFullMapView(false);
      }
    };

    // Add event listener
    window.addEventListener('zoneClicked', handleZoneClick);

    return () => {
      window.removeEventListener('zoneClicked', handleZoneClick);
    };
  }, [dimensions.width]);

  // Handle zoom changes
  const handleZoomChange = React.useCallback((event: any) => {
    if (event && event.a !== undefined) {
      setZoomLevel(event.a);
    } else {
      preventDefault(event);
    }
  }, []);

  // Handle zone click to zoom to the zone
  const handleZoneClick = React.useCallback((zoneId: string) => {
    if (!mapData) return;
    const zone = mapData.zones.find(z => z.id === zoneId);
    if (zone && Viewer.current) {
      // Calculate zone bounds in global coordinates
      const { minX, minY, maxX, maxY } = calculateZoneBounds(zone);
      const globalMinX = minX + zone.position_x;
      const globalMinY = minY + zone.position_y;
      const globalMaxX = maxX + zone.position_x;
      const globalMaxY = maxY + zone.position_y;
      
      // Calculate center of the zone
      const centerX = (globalMinX + globalMaxX) / 2;
      const centerY = (globalMinY + globalMaxY) / 2;
      
      // Calculate appropriate zoom level to fit the zone
      const zoneWidth = globalMaxX - globalMinX;
      const zoneHeight = globalMaxY - globalMinY;
      const viewerWidth = dimensions.width;
      const viewerHeight = dimensions.height;
      
      // Calculate zoom level to make the zone fill the entire screen
      const scaleX = viewerWidth / zoneWidth;
      const scaleY = viewerHeight / zoneHeight;
      // Use the smaller scale to ensure the entire zone fits in the viewport
      const newZoomLevel = Math.min(scaleX, scaleY) * 0.95; // Slightly smaller to ensure edges are visible

      Viewer.current.setPointOnViewerCenter(centerX, centerY, newZoomLevel);
      
      // Update the zoom level state to trigger rectangle opacity change
      setZoomLevel(newZoomLevel);
    }
  }, [mapData, dimensions]);

  // Loading state
  if (!mapData || !mapData.width || !mapData.height) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Prepare legend items
  const legendItems: LegendItem[] = Object.entries(categories).map(([name, { color, price }]) => ({
    id: name,
    name,
    color,
    price,
    type: 'price' as const,
  }));

  const isMobile = dimensions.width <= 768;

  return (
    <div
      className={`relative w-full h-screen overflow-hidden ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}
    >
      {/* SVG Definitions */}
      <SVGPatterns />

      {/* LEFT FLOATING PANEL: LEGEND AND THEME SWITCHER */}
      <div className="absolute left-4 top-4 z-10 flex flex-row gap-3 items-start w-[330px]">
        <SeatMapLegendSimple
          isDarkMode={isDarkMode}
          legendItems={legendItems}
          isCollapsed={legendCollapsed}
        />
        <ThemeToggle isDarkMode={isDarkMode} onToggle={toggleDarkMode} />
        <FullMapButton isDarkMode={isDarkMode} onClick={handleFitToViewer} />
        {/* <QRScannerButton isDarkMode={isDarkMode} /> */}
      </div>

      {/* FULL SCREEN MAP */}
      <div className="w-full h-full">
        <UncontrolledReactSVGPanZoom
          ref={Viewer}
          width={dimensions.width}
          height={dimensions.height}
          tool="auto"
          miniatureProps={{ position: 'none', background: 'transparent', width: 100, height: 80 }}
          toolbarProps={{ position: 'none' }}
          background="transparent"
          detectAutoPan={false}
          preventPanOutside={false}
          SVGBackground="transparent"
          scaleFactorMin={0.1}
          onZoom={handleZoomChange}
          onDoubleClick={preventDefault}
          style={{ touchAction: 'manipulation' }}
        >
          <svg
            width={mapData.width}
            height={mapData.height}
            viewBox={`0 0 ${mapData.width} ${mapData.height}`}
            style={{ backgroundColor: 'transparent' }}
          >
            {mapData.zones.map(zone => (
              <Zone
                key={zone.id}
                zone={zone}
                categories={categories}
                selectedSeats={selectedSeats}
                onSeatClick={handleSeatClick}
                onZoneClick={handleZoneClick}
                zoomLevel={zoomLevel}
                isMobile={isMobile}
                isFullMapView={isFullMapView}
              />
            ))}
          </svg>
        </UncontrolledReactSVGPanZoom>
      </div>

      {/* RIGHT FLOATING PANEL: BOOKING FORM (only shows when seats are selected) */}
      {selectedSeats.length > 0 && (
        <BookingForm
          isDarkMode={isDarkMode}
          selectedSeats={selectedSeats}
          onSubmit={handleBookingSubmit}
          onRemoveSeat={handleRemoveSeat}
          onClearAll={handleClearAll}
          zones={mapData.zones}
          categories={categories}
          isLoading={isBookingLoading}
        />
      )}

      {/* NOTIFICATION */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};

export default SeatMapFloat;
