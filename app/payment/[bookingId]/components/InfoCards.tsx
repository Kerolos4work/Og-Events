/* eslint-disable @next/next/no-img-element */
'use client';

import { Clock, Banknote, Armchair } from 'lucide-react';

interface InfoCardsProps {
  bookingDetails: any;
  timeLeft: number;
  formattedTime: string;
  isDarkMode: boolean;
}

export default function InfoCards({ bookingDetails, timeLeft, formattedTime, isDarkMode }: InfoCardsProps) {
  const isTimeRunningOut = timeLeft < 60;

  return (
    <div className="grid grid-cols-3 gap-4 mb-3">
      {/* Timer Card */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-4 flex flex-col items-center`}>
        <Clock className={`h-6 w-6 ${isTimeRunningOut ? 'text-red-500' : isDarkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`} />
        <div className={`text-lg font-bold ${isTimeRunningOut ? (isDarkMode ? 'text-red-400' : 'text-red-600') : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {formattedTime}
        </div>
        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center mt-1`}>Time Left</div>
      </div>

      {/* Amount Card */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-4 flex flex-col items-center`}>
        <Banknote className={`h-6 w-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'} mb-2`} />
        <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {bookingDetails.amount}
        </div>
        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center mt-1`}>EGP</div>
      </div>

      {/* Seats Card */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md p-4 flex flex-col items-center`}>
        <Armchair className={`h-6 w-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} mb-2`} />
        <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {bookingDetails.seats?.length || 0}
        </div>
        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center mt-1`}>Seats</div>
      </div>
    </div>
  );
}
