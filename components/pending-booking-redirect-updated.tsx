import { usePendingBookingRedirect } from '@/lib/booking-redirect';

/**
 * Component that checks for pending bookings and redirects users to the payment page
 * This component should be placed in the layout to ensure it runs on all pages
 */
export function PendingBookingRedirect() {
  // Use the custom hook to handle the redirect logic
  usePendingBookingRedirect();

  // This component doesn't render anything visible
  return null;
}
