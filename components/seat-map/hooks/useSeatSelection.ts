import { useState, useCallback, useRef, useEffect } from 'react';
import { Seat, GuestForm } from '../types';
import { createGuestBooking } from '../services';
import { uploadFile } from '@/lib/storage';
import { savePendingBooking } from '@/lib/booking-redirect';
import { addOrderId } from '@/lib/orderIdsManager';
import { MAX_SEATS_PER_BOOKING, MIN_SEATS_PER_BOOKING, ERROR_MESSAGES } from '../constants';

interface UseSeatSelectionReturn {
  selectedSeats: Seat[];
  isBookingLoading: boolean;
  handleSeatClick: (seat: Seat) => { success: boolean; error?: string };
  handleRemoveSeat: (seatId: string) => void;
  handleClearAll: () => void;
  handleBookingSubmit: (formData: GuestForm) => Promise<{ success: boolean; error?: string }>;
}

export const useSeatSelection = (
  refetchMap: () => void,
  categories: Record<string, any> = {}
): UseSeatSelectionReturn => {
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]); // The "Cart"
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  // 1. HANDLE CLICK (Toggle Selection)
  // 1. Ref pattern to keep callback stable
  const selectedSeatsRef = useRef<Seat[]>(selectedSeats);
  useEffect(() => {
    selectedSeatsRef.current = selectedSeats;
  }, [selectedSeats]);

  // 1. HANDLE CLICK (Toggle Selection)
  const handleSeatClick = useCallback(
    (seat: Seat): { success: boolean; error?: string } => {
      if (seat.status !== 'available') {
        return { success: false, error: 'This seat is not available' };
      }

      const currentSelected = selectedSeatsRef.current;
      const isSelected = currentSelected.find(s => s.id === seat.id);

      if (isSelected) {
        // Unselect
        setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
        return { success: true };
      } else {
        // Select (Enforce Limit)
        if (currentSelected.length >= MAX_SEATS_PER_BOOKING) {
          return { success: false, error: ERROR_MESSAGES.MAX_SEATS_EXCEEDED };
        }
        setSelectedSeats(prev => [...prev, seat]);
        return { success: true };
      }
    },
    [] // Stable callback!
  );

  // 2. HANDLE REMOVE SEAT
  const handleRemoveSeat = useCallback((seatId: string) => {
    setSelectedSeats(prev => prev.filter(s => s.id !== seatId));
  }, []);

  // 3. HANDLE CLEAR ALL
  const handleClearAll = useCallback(() => {
    setSelectedSeats([]);
  }, []);

  // 4. HANDLE SUBMIT
  const handleBookingSubmit = useCallback(
    async (formData: GuestForm): Promise<{ success: boolean; error?: string }> => {

      // Validate minimum seats
      if (selectedSeats.length < MIN_SEATS_PER_BOOKING) {
        return { success: false, error: ERROR_MESSAGES.MIN_SEATS_REQUIRED };
      }

      // Validate form fields - already validated by Zod but double safe
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
        return { success: false, error: ERROR_MESSAGES.REQUIRED_FIELDS };
      }

      const seatIds = selectedSeats.map(s => s.id);

      setIsBookingLoading(true);

      try {
        // Calculate total price based on selected seats
        // We need to import the calculateTotalPrice function
        const { calculateTotalPrice } = await import('../utils/seatHelpers');
        const totalPrice = calculateTotalPrice(selectedSeats, categories);

        // No payment proof at initial booking stage
        const paymentProofUrl = null;

        // Call our new SQL function
        const { data, error } = await createGuestBooking(
          seatIds,
          formData.name.trim(),
          formData.email.trim(),
          formData.phone.trim(),
          totalPrice,
          paymentProofUrl
        );

        if (error) {
          console.error('Booking error:', error);
          return { success: false, error: ERROR_MESSAGES.SYSTEM_ERROR };
        }

        if (!data) {
          return { success: false, error: ERROR_MESSAGES.BOOKING_FAILED };
        }

        if (data.success) {
          // Clear cart on success
          setSelectedSeats([]);
          // Form clearing is handled by the form component now

          // Redirect to payment page
          if (data.booking_id) {
            // Save the booking ID to localStorage before redirecting
            savePendingBooking(data.booking_id);
            // Also add the booking ID to the userOrderIds list
            addOrderId(data.booking_id);
            window.location.href = `/payment/${data.booking_id}`;
          }

          return { success: true };
        } else {
          // Seats no longer available or other booking failure
          const errorMessage = data.message || ERROR_MESSAGES.SEAT_UNAVAILABLE;
          // Refresh map to show updated seat status
          refetchMap();
          return { success: false, error: errorMessage };
        }
      } catch (error) {
        console.error('Unexpected booking error:', error);
        return { success: false, error: ERROR_MESSAGES.NETWORK_ERROR };
      } finally {
        setIsBookingLoading(false);
      }
    },
    [selectedSeats, refetchMap, categories]
  );

  return {
    selectedSeats,
    isBookingLoading,
    handleSeatClick,
    handleRemoveSeat,
    handleClearAll,
    handleBookingSubmit,
  };
};
