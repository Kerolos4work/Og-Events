'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { updateBookingWithPayment } from '@/components/seat-map/services';

// ... (handleApprove function remains the same)
const handleApprove = async (bookingId: string) => {
  try {
    const response = await fetch('/api/approve-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingId }),
    });

    if (!response.ok) {
      throw new Error('Failed to approve booking');
    }

    const result = await response.json();
    console.log('Booking approved with handleApprove:', result);
    return result;
  } catch (err: any) {
    console.error('Error in handleApprove:', err);
    return { success: false, error: err.message || 'An unexpected error occurred' };
  }
};

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const orderId = searchParams.get('orderId');
      const paymentStatus = searchParams.get('paymentStatus');
      const transactionId = searchParams.get('transactionId');
      const signature = searchParams.get('signature');
      const amount = searchParams.get('amount');
      const currency = searchParams.get('currency');

      // Log all search params for debugging
      console.log('All search params:', Array.from(searchParams.entries()));

      // Convert searchParams to object for signature validation
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      console.log('Payment verification data:', { orderId, paymentStatus, transactionId, signature, amount, currency });

      if (!orderId) {
        setError('Missing order ID in payment response');
        setIsVerifying(false);
        return;
      }

      // Validate signature if signature is present
      if (signature) {
        try {
          console.log('Sending parameters for validation:', params);

          // Send all parameters to the validation endpoint
          const response = await fetch('/api/payment/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              params: params
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to validate signature');
          }

          const data = await response.json();

          console.log('Validation response:', data);

          if (!data.isValid) {
            console.error('Invalid payment signature');
            setError('Invalid payment signature - possible tampering detected');
            setIsVerifying(false);
            return;
          }

          console.log('Payment signature validated successfully');
        } catch (e) {
          console.error('Error validating signature:', e);
          setError('Error validating payment signature');
          setIsVerifying(false);
          return;
        }
      }

      if (paymentStatus === 'SUCCESS') {
        setIsSuccess(true);

        // Update booking with payment proof
        try {
          const merchantOrderId = searchParams.get('merchantOrderId');
          if (merchantOrderId) {
            // Update the booking with payment proof
            const { data, error } = await updateBookingWithPayment(merchantOrderId, 'online');

            if (error) {
              console.error('Failed to update booking with payment:', error);
            } else {
              console.log('Booking updated successfully with online payment');

              // Auto-approve the booking after successful payment
              const booking = { id: merchantOrderId };
              handleApprove(booking.id);
            }
          }

          // Update booking status in local state for immediate UI feedback
          // The webhook will handle the database update
          // Save payment info to localStorage for potential recovery
          localStorage.setItem('lastPayment', JSON.stringify({
            orderId,
            transactionId,
            paymentStatus,
            timestamp: new Date().toISOString()
          }));
        } catch (e) {
          console.error('Error saving payment info to localStorage:', e);
        }
      } else {
        setError(`Payment status: ${paymentStatus || 'Unknown'}`);
      }

      setIsVerifying(false);
    };

    verifyPayment();
  }, [searchParams]);

  const handleContinue = () => {
    // Clear any pending booking
    localStorage.removeItem('pendingBooking');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex flex-col items-center">
            {isVerifying ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Payment</h2>
                <p className="text-gray-600">Please wait while we verify your payment...</p>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful</h2>
                <p className="text-gray-600 mb-6">Your payment has been processed successfully. Your booking is now confirmed.</p>
                <p className="text-sm text-gray-500 mb-6">Order ID: {searchParams.get('orderId')}</p>
                <button
                  onClick={handleContinue}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Verification Failed</h2>
                <p className="text-gray-600 mb-2">{error || 'We couldn&#39;t verify your payment.'}</p>
                <p className="text-sm text-gray-500 mb-6">Order ID: {searchParams.get('orderId')}</p>
                <button
                  onClick={handleContinue}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Return to Home
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
            </div>
          </div>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
