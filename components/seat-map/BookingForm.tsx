'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Tickets, ChevronUp } from 'lucide-react';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { Seat, Zone, Category } from './types';
import {
  calculateTotalPrice,
  findZoneNameByRowId,
  findRowNumberByRowId,
  getSeatPrice,
} from './utils/seatHelpers';
import { bookingSchema, BookingSchema } from '@/lib/validators/booking';

interface BookingFormProps {
  isDarkMode: boolean;
  selectedSeats: Seat[];
  onSubmit: (data: BookingSchema) => void;
  onRemoveSeat?: (seatId: string) => void;
  onClearAll?: () => void;
  zones?: Zone[];
  categories?: Record<string, Category>;
  isLoading?: boolean;
}

const BookingForm: React.FC<BookingFormProps> = ({
  isDarkMode,
  selectedSeats,
  onSubmit,
  onRemoveSeat,
  onClearAll,
  zones = [],
  categories = {},
  isLoading = false,
}) => {
  const { t, isRTL, language } = useLanguageContext();

  // Force re-render when language changes
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  React.useEffect(() => {
    // Listen for language changes
    const handleLanguageChange = () => {
      forceUpdate();
    };

    window.addEventListener('languageChange', handleLanguageChange);

    return () => {
      window.removeEventListener('languageChange', handleLanguageChange);
    };
  }, [language]);
  // State for mobile expand/collapse
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset to collapsed when seats are cleared
  useEffect(() => {
    if (selectedSeats.length === 0) {
      setIsExpanded(false);
    }
  }, [selectedSeats.length]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<BookingSchema>({
    resolver: zodResolver(bookingSchema),
    mode: 'onChange',
  });

  // Calculate total price using utility function
  const totalPrice = calculateTotalPrice(selectedSeats, categories);

  // Add style tag for webkit scrollbar
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [isDarkMode]);

  // Base input styles
  const inputBaseClasses = `px-2 py-1.5 rounded-lg border text-sm w-full focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors`;
  const getInputClasses = (hasError: boolean) => {
    if (hasError)
      return `${inputBaseClasses} border-red-500 focus:ring-red-500 bg-red-50 text-red-900 placeholder-red-300`;
    return `${inputBaseClasses} ${
      isDarkMode
        ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-transparent'
        : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-500 focus:ring-blue-500 focus:border-transparent'
    }`;
  };

  return (
    <div
      className={`absolute z-20 transition-all duration-300 transform ${
        isMobile
          ? `bottom-0 left-0 right-0 rounded-t-3xl ${isExpanded ? 'h-[87vh]' : 'h-auto'}`
          : `top-4 ${isRTL() ? 'left-4' : 'right-4'}`
      }`}
    >
      <div
        className={`${isDarkMode ? 'border-white/10' : 'border-black/10'} border shadow-2xl ${
          isMobile
            ? 'rounded-t-3xl w-full flex flex-col h-full'
            : 'rounded-2xl w-72 max-w-[90vw] p-4'
        }`}
        style={{
          backgroundColor: isDarkMode ? 'rgb(0 0 0 / 0.6)' : 'rgb(255 255 255 / 0.6)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Header with title and price - always visible on mobile */}
        <div
          className={`${isMobile ? 'p-4' : 'mb-3'} ${isMobile ? '' : `border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'} pb-3`}`}
        >
          <div
            className={`flex justify-between items-center ${isMobile ? 'cursor-pointer' : ''}`}
            onClick={isMobile ? () => setIsExpanded(!isExpanded) : undefined}
          >
            <div>
              <h3
                className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'} leading-none mb-1`}
              >
                {t('selection')}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {selectedSeats.length} {t('seats')}
                </span>
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-xs`}>
                  |
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onClearAll?.();
                  }}
                  className={`text-xs font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
                  type="button"
                >
                  {t('clearAll')}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-yellow-400 text-black font-bold px-3 py-1 rounded-lg shadow-lg text-sm">
                {totalPrice} {isRTL() ? 'ج • م' : 'EGP'}
              </div>
              {isMobile && (
                <div
                  className={`p-1 rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <ChevronUp width={20} height={20} color={isDarkMode ? '#ffffff' : '#000000'} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Guest Information Form and Buy Now Button - always visible */}
        {isMobile ? (
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 pt-0 grid grid-cols-1 gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  {...register('name')}
                  type="text"
                  className={getInputClasses(!!errors.name)}
                  placeholder={t('name')}
                />
              </div>
              <div>
                <input
                  {...register('email')}
                  type="email"
                  className={getInputClasses(!!errors.email)}
                  placeholder={t('email')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  {...register('phone')}
                  type="tel"
                  className={`${getInputClasses(!!errors.phone)} ${isRTL() ? 'text-right' : ''}`}
                  placeholder={t('phone')}
                  dir={isRTL() ? 'rtl' : 'ltr'}
                />
              </div>
              <button
                type="submit"
                disabled={selectedSeats.length === 0 || isLoading || !isValid}
                className={`bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold py-1.5 rounded-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
              >
                {isLoading ? t('bookingProgress') : t('bookNow')}
                {!isLoading && <Tickets width={14} height={14} />}
              </button>
            </div>
            {/* Error Messages */}
            {(errors.name || errors.email || errors.phone) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2 animate-pulse">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 text-red-500 mr-1.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs text-red-700 font-medium">
                    {errors.name?.message || errors.email?.message || errors.phone?.message}
                  </span>
                </div>
              </div>
            )}
          </form>
        ) : null}

        {/* Selected seats list - hidden on mobile when collapsed */}
        {(!isMobile || isExpanded) && (
          <div
            className={`${isMobile ? 'flex-1 overflow-y-auto px-4' : 'max-h-48 overflow-y-auto mb-4 pr-1'} custom-scrollbar`}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: isDarkMode
                ? 'rgba(255, 255, 255, 0.3) transparent'
                : 'rgba(0, 0, 0, 0.3) transparent',
            }}
          >
            {selectedSeats.map(seat => (
              <div
                key={seat.id}
                className={`group flex justify-between items-center text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} py-2 border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'} last:border-0 rounded ${isMobile ? 'px-0' : 'px-2'}`}
              >
                <div className="flex flex-col">
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {seat.category}
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {t('zone')} {findZoneNameByRowId(zones, seat.row_id)} {t('row')}{' '}
                    {findRowNumberByRowId(zones, seat.row_id)} {t('seat')} {seat.seat_number}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} font-mono`}
                  >
                    {getSeatPrice(seat.category, categories)}
                  </span>
                  <button
                    onClick={() => onRemoveSeat && onRemoveSeat(seat.id)}
                    className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} p-1 rounded-full`}
                    disabled={isLoading}
                    type="button"
                  >
                    <X width={14} height={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Guest Information Form and Buy Now Button - desktop */}
        {!isMobile && (
          <form onSubmit={handleSubmit(onSubmit)} className="pt-0 grid grid-cols-1 gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  {...register('name')}
                  type="text"
                  className={getInputClasses(!!errors.name)}
                  placeholder={t('name')}
                />
              </div>
              <div>
                <input
                  {...register('email')}
                  type="email"
                  className={getInputClasses(!!errors.email)}
                  placeholder={t('email')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  {...register('phone')}
                  type="tel"
                  className={`${getInputClasses(!!errors.phone)} ${isRTL() ? 'text-right' : ''}`}
                  placeholder={t('phone')}
                  dir={isRTL() ? 'rtl' : 'ltr'}
                />
              </div>
              <button
                type="submit"
                disabled={selectedSeats.length === 0 || isLoading || !isValid}
                className={`bg-gradient-to-r from-indigo-600 to-blue-500 text-white font-bold py-1.5 rounded-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
              >
                {isLoading ? t('bookingProgress') : t('bookNow')}
                {!isLoading && <Tickets width={14} height={14} />}
              </button>
            </div>
            {/* Error Messages */}
            {(errors.name || errors.email || errors.phone) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2 animate-pulse">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 text-red-500 mr-1.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs text-red-700 font-medium">
                    {errors.name?.message || errors.email?.message || errors.phone?.message}
                  </span>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default BookingForm;
