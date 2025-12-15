"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryToggle } from "./category-toggle";
import { Badge } from "@/components/ui/badge";

interface Seat {
  id: string;
  seat_number: string;
  category: string;
  status: string;
  rows: {
    row_number: string;
    zones: {
      name: string;
    };
  };
}

interface Category {
  id: string;
  name: string;
  color: string;
  count: number;
}

interface SeatMapProps {
  seats: Seat[];
  onSeatClick?: (seat: Seat) => void;
}

export function SeatMap({ seats, onSeatClick }: SeatMapProps) {
  // Fetch seats from database if not provided
  const [seatsData, setSeatsData] = useState<Seat[]>(seats || []);
  const [loading, setLoading] = useState(seats ? false : true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (seats && seats.length > 0) {
      setLoading(false);
      return;
    }

    const fetchSeats = async () => {
      try {
        const { getSeats } = await import('../actions/seats');
        const data = await getSeats();
        
        setSeatsData(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching seats');
        setLoading(false);
      }
    };

    fetchSeats();
  }, [seats]);

  // Extract categories from seats
  const categoriesFromSeats = (seatsData || []).reduce((acc: Record<string, Category>, seat) => {
    if (!acc[seat.category]) {
      // Generate a color based on category name
      const hue = seat.category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;
      acc[seat.category] = {
        id: seat.category,
        name: seat.category,
        color: `hsl(${hue}, 70%, 50%)`,
        count: 0
      };
    }
    acc[seat.category].count++;
    return acc;
  }, {});

  const categories = Object.values(categoriesFromSeats);

  const [visibleCategories, setVisibleCategories] = useState<Record<string, boolean>>(
    categories.reduce((acc, category) => {
      acc[category.id] = true; // All categories visible by default
      return acc;
    }, {} as Record<string, boolean>)
  );

  const handleToggleChange = (categoryId: string, isVisible: boolean) => {
    setVisibleCategories(prev => ({
      ...prev,
      [categoryId]: isVisible
    }));
  };

  // Group seats by row for display
  const seatsByRow = (seatsData || []).reduce((acc, seat) => {
    const rowKey = `${seat.rows.zones.name}-${seat.rows.row_number}`;
    if (!acc[rowKey]) {
      acc[rowKey] = [];
    }
    acc[rowKey].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  // Sort rows
  const sortedRows = Object.entries(seatsByRow)
    .sort(([a], [b]) => {
      const [zoneA, rowA] = a.split('-');
      const [zoneB, rowB] = b.split('-');

      if (zoneA !== zoneB) {
        return zoneA.localeCompare(zoneB);
      }
      return parseInt(rowA) - parseInt(rowB);
    });

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            Error loading seat map: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <CategoryToggle 
        categories={categories} 
        onToggleChange={handleToggleChange}
      />

      <Card>
        <CardHeader>
          <CardTitle>Seat Map</CardTitle>
          <CardDescription>
            Interactive seat map showing available and occupied seats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {sortedRows.map(([rowKey, rowSeats]) => {
                const [zone, row] = rowKey.split('-');
                return (
                  <div key={rowKey} className="mb-4">
                    <div className="text-sm font-medium mb-2">
                      {zone} - Row {row}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rowSeats.map((seat) => {
                        const isVisible = visibleCategories[seat.category];
                        const isBooked = seat.status === 'booked';
                        const isReserved = seat.status === 'reserved';

                        return (
                          <button
                            key={seat.id}
                            onClick={() => onSeatClick && onSeatClick(seat)}
                            disabled={!isVisible || isBooked}
                            className={`
                              w-8 h-8 rounded text-xs font-medium transition-all
                              ${isVisible ? 'opacity-100' : 'opacity-30'}
                              ${isBooked ? 'bg-red-500 text-white cursor-not-allowed' : ''}
                              ${isReserved ? 'bg-yellow-500 text-white cursor-not-allowed' : ''}
                              ${!isBooked && !isReserved ? 'bg-green-500 text-white hover:bg-green-600' : ''}
                            `}
                            style={
                              isVisible && !isBooked && !isReserved 
                                ? { backgroundColor: categoriesFromSeats[seat.category].color } 
                                : {}
                            }
                            title={`${seat.seat_number} - ${seat.category} (${seat.status})`}
                          >
                            {seat.seat_number}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">Booked</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
