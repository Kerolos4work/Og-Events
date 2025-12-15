/* eslint-disable @next/next/no-img-element */
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CreditCard } from 'lucide-react';

interface ActionButtonsProps {
  isDarkMode: boolean;
  file: File | null;
  isUploading: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  bookingId?: string;
  bookingDetails?: any;
  paymentMode?: string;
}

export default function ActionButtons({
  isDarkMode,
  file,
  isUploading,
  handleSubmit,
  bookingId,
  bookingDetails,
  paymentMode
}: ActionButtonsProps) {
  const router = useRouter();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleOnlinePayment = async () => {
    if (!bookingId || !bookingDetails) return;

    setIsProcessingPayment(true);

    try {
      // Get the price from booking details, with fallback to 0 if undefined
      const amount = bookingDetails.amount;

      // Generate hash for the payment
      const response = await fetch('/api/payment/hash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'EGP', // Default currency, can be adjusted
          orderId: bookingId,
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.error('Error generating payment hash:', data.error);
        setIsProcessingPayment(false);
        return;
      }

      // Build the payment URL with all required parameters
      const merchantId = process.env.NEXT_PUBLIC_KASHIER_MERCHANT_ID || 'MID-41460-868';
      const paymentUrl = new URL('https://payments.kashier.io/');

      paymentUrl.searchParams.append('merchantId', merchantId);
      paymentUrl.searchParams.append('orderId', bookingId);
      paymentUrl.searchParams.append('amount', amount.toString());
      paymentUrl.searchParams.append('currency', 'EGP');
      paymentUrl.searchParams.append('hash', data.hash);
      paymentUrl.searchParams.append('mode', 'test'); // Change to 'live' for production
      paymentUrl.searchParams.append('merchantRedirect', 'http://localhost:3000/payment/success');
      paymentUrl.searchParams.append('serverWebhook', 'http://localhost:3000/api/payment/webhook');
      paymentUrl.searchParams.append('paymentRequestId', `req_${Date.now()}`);
      paymentUrl.searchParams.append('allowedMethods', 'card,instapay,fawry,wallet');
      paymentUrl.searchParams.append('defaultMethod', 'wallet');
      paymentUrl.searchParams.append('failureRedirect', 'http://localhost:3000/payment/failure');
      paymentUrl.searchParams.append('redirectMethod', 'GET');
      paymentUrl.searchParams.append('brandColor', '#4F46E5');
      paymentUrl.searchParams.append('display', 'en');
      paymentUrl.searchParams.append('manualCapture', 'false');
      paymentUrl.searchParams.append('saveCard', 'false');
      paymentUrl.searchParams.append('interactionSource', 'Ecommerce');
      paymentUrl.searchParams.append('enable3DS', 'true');

      // Redirect to payment page
      window.location.href = paymentUrl.toString();
    } catch (error) {
      console.error('Error processing payment:', error);
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="flex gap-3 mt-6">
      {/* Upload Button - Only show for manual payment mode */}
      {paymentMode === 'manual' && (
        <button
          type="submit"
          disabled={!file || isUploading}
          className={`flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100`}
          onClick={handleSubmit}
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            <>
              Upload
            </>
          )}
        </button>
      )}

      {/* Kasher Button - Only show for online payment mode */}
      {paymentMode === 'online' && (
        <button
          type="button"
          disabled={isProcessingPayment || !bookingId || !bookingDetails}
          className={`flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100`}
          onClick={handleOnlinePayment}
        >
          {isProcessingPayment ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay Online
            </>
          )}
        </button>
      )}
    </div>
  );
}
