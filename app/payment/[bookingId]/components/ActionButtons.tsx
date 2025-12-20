/* eslint-disable @next/next/no-img-element */
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { useLanguageContext } from '@/contexts/LanguageContext';

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
  paymentMode,
}: ActionButtonsProps) {
  const router = useRouter();
  const { t, isRTL } = useLanguageContext();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleOnlinePayment = async () => {
    if (!bookingId || !bookingDetails) {
      console.error('Missing booking ID or booking details');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Get the price from booking details, with fallback to 0 if undefined
      const amount = bookingDetails.amount;
      console.log('Payment amount:', amount, 'Booking ID:', bookingId);

      if (!amount || amount <= 0) {
        console.error('Invalid payment amount:', amount);
        setIsProcessingPayment(false);
        alert(t('invalidAmount') || 'Invalid payment amount');
        return;
      }

      // Generate hash for the payment
      const response = await fetch('/api/payment/hash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'EGP', // Default currency, can be adjusted
          orderId: bookingId,
        }),
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error generating payment hash:', errorData);
        setIsProcessingPayment(false);
        alert(t('paymentHashError') || 'Failed to generate payment hash');
        return;
      }

      const data = await response.json();
      console.log('Payment hash generated:', data);

      if (data.error) {
        console.error('Error generating payment hash:', data.error);
        setIsProcessingPayment(false);
        alert(t('paymentHashError') || 'Failed to generate payment hash');
        return;
      }

      // Build the payment URL with all required parameters
      const merchantId = process.env.NEXT_PUBLIC_KASHIER_MERCHANT_ID || '';
      const paymentUrl = new URL('https://payments.kashier.io/');

      const origin = window.location.origin;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || origin;

      paymentUrl.searchParams.append('merchantId', merchantId);
      paymentUrl.searchParams.append('orderId', bookingId);
      paymentUrl.searchParams.append('amount', amount.toString());
      paymentUrl.searchParams.append('currency', 'EGP');
      paymentUrl.searchParams.append('hash', data.hash);
      paymentUrl.searchParams.append('mode', process.env.NEXT_PUBLIC_KASHIER_MODE || '');
      paymentUrl.searchParams.append('merchantRedirect', `${origin}/payment/success`);
      paymentUrl.searchParams.append('serverWebhook', `${baseUrl}/api/payment/webhook/`);
      paymentUrl.searchParams.append('paymentRequestId', `req_${Date.now()}`);
      paymentUrl.searchParams.append('allowedMethods', 'card,instapay,fawry,wallet');
      paymentUrl.searchParams.append('defaultMethod', 'wallet');
      paymentUrl.searchParams.append('failureRedirect', `${origin}/payment/failure`);
      paymentUrl.searchParams.append('redirectMethod', 'GET');
      paymentUrl.searchParams.append('brandColor', '#4F46E5');
      paymentUrl.searchParams.append('display', isRTL() ? 'ar' : 'en');

      // Log the final payment URL for debugging
      console.log('Redirecting to payment URL:', paymentUrl.toString());

      // Redirect to payment page
      window.location.href = paymentUrl.toString();
    } catch (error) {
      console.error('Error processing payment:', error);
      setIsProcessingPayment(false);
      alert(t('paymentProcessingError') || 'An error occurred while processing your payment');
    }
  };

  return (
    <div className={`flex ${isRTL() ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
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
              <div
                className={`animate-spin rounded-full h-4 w-4 border-b-2 border-white ${isRTL() ? 'ml-2' : 'mr-2'}`}
              ></div>
              {t('uploading')}
            </>
          ) : (
            <>{t('upload')}</>
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
              <div
                className={`animate-spin rounded-full h-4 w-4 border-b-2 border-white ${isRTL() ? 'ml-2' : 'mr-2'}`}
              ></div>
              {t('processing')}
            </>
          ) : (
            <>
              <CreditCard className={`h-4 w-4 ${isRTL() ? 'ml-2' : 'mr-2'}`} />
              {t('payOnline')}
            </>
          )}
        </button>
      )}
    </div>
  );
}
