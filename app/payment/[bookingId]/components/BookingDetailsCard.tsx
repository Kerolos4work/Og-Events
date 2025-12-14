/* eslint-disable @next/next/no-img-element */
'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface BookingDetailsCardProps {
  bookingId: string;
  bookingDetails: any;
  isDarkMode: boolean;
}

export default function BookingDetailsCard({ bookingId, bookingDetails, isDarkMode }: BookingDetailsCardProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  
  const handleCancelBooking = async () => {
    if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      setIsCancelling(true);
      try {
        // Import Supabase
        const { supabase } = await import('@/lib/supabase');

        // Delete the booking from the database
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingId);

        if (error) {
          console.error('Error cancelling booking:', error);
          alert('Failed to cancel booking. Please try again.');
        } else {
          // Remove the pending booking from local storage
          localStorage.removeItem('pendingBooking');

          // Redirect to home page
          router.push('/');
        }
      } catch (err) {
        console.error('Error cancelling booking:', err);
        alert('An error occurred while cancelling the booking.');
      } finally {
        setIsCancelling(false);
      }
    }
  };
  
  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-4 mb-3`}>
      <div className={`flex justify-between items-start`}>
        <div className="flex flex-col">
          <p className={`text-xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{bookingDetails.name || 'Guest User'}</p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{bookingDetails.phone || 'No phone number'}</p>
        </div>
        <div className="flex flex-col items-end">
          <button
            onClick={handleCancelBooking}
            disabled={isCancelling}
            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${isDarkMode ? 'bg-red-900 text-red-200 hover:bg-red-800 disabled:opacity-50' : 'bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50'}`}
          >
            {isCancelling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1"></div>
                Cancelling...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-1" />
                Cancel Booking
              </>
            )}
          </button>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>ID: {bookingId.split('-')[0]}</p>
        </div>
      </div>
    </div>
  );
}
