/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';
import { Upload } from 'lucide-react';
import BookingDetailsCard from './BookingDetailsCard';
import InfoCards from './InfoCards';
import PaymentMethodSelector from './PaymentMethodSelector';
import FileUpload from './FileUpload';
import ActionButtons from './ActionButtons';
import SeatNamesList from './SeatNamesList';
import settings from '../../../../config/settings.json';
import { useLanguageContext } from '@/contexts/LanguageContext';

interface PaymentMethod {
  image: string;
  title: string;
  phoneNumber: string;
  name: string;
  color?: string;
}

interface PaymentPageProps {
  bookingId: string;
  bookingDetails: any;
  timeLeft: number;
  formattedTime: string;
  file: File | null;
  isUploading: boolean;
  isConverting?: boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  seatNames: Record<string, string>;
  onSeatNameChange: (seatId: string, name: string) => void;
  allNamesFilled: boolean;
}

export default function PaymentPage({
  bookingId,
  bookingDetails,
  timeLeft,
  formattedTime,
  file,
  isUploading,
  isConverting,
  handleFileChange,
  handleSubmit,
  seatNames,
  onSeatNameChange,
  allNamesFilled
}: PaymentPageProps) {
  const { isDarkMode } = useDarkMode();
  const { t, isRTL } = useLanguageContext();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const paymentMode = settings.payment.mode;

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col ${isRTL() ? 'rtl' : ''}`}>
      <div className="flex-grow px-4 py-6 max-w-lg mx-auto w-full flex flex-col justify-center">
        {/* Booking Details Section */}
        <BookingDetailsCard
          bookingId={bookingId}
          bookingDetails={bookingDetails}
          isDarkMode={isDarkMode}
        />

        {/* Important Info Cards - Timer, Amount, Number of Seats */}
        <InfoCards
          bookingDetails={bookingDetails}
          timeLeft={timeLeft}
          formattedTime={formattedTime}
          isDarkMode={isDarkMode}
        />

        {/* Seat Names List - Required before payment */}
        {bookingDetails?.seats && bookingDetails.categories && (
          <SeatNamesList
            seats={bookingDetails.seats}
            categories={bookingDetails.categories}
            seatNames={seatNames}
            onNameChange={onSeatNameChange}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Payment Method Selection - Only show for manual payment mode */}
        {paymentMode === 'manual' && (
          <PaymentMethodSelector
            isDarkMode={isDarkMode}
            onMethodSelect={handlePaymentMethodSelect}
          />
        )}

        {/* Upload Section - Only show for manual payment mode and after payment method is selected */}
        {paymentMode === 'manual' && selectedPaymentMethod && (
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-4 mb-3`}>
            <div className="flex items-center mb-4">
              <Upload className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('uploadPaymentProof')}</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <FileUpload
                file={file}
                isDarkMode={isDarkMode}
                isConverting={isConverting || false}
                handleFileChange={handleFileChange}
              />
            </form>
          </div>
        )}

        {/* Action Buttons - Always visible */}
        <form onSubmit={handleSubmit}>
          <ActionButtons
            isDarkMode={isDarkMode}
            file={file}
            isUploading={isUploading}
            handleSubmit={handleSubmit}
            bookingId={bookingId}
            bookingDetails={bookingDetails}
            paymentMode={paymentMode}
            allNamesFilled={allNamesFilled}
          />
        </form>
      </div>
    </div>
  );
}
