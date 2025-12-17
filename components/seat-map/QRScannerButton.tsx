
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';

interface QRScannerButtonProps {
  isDarkMode: boolean;
}

export const QRScannerButton: React.FC<QRScannerButtonProps> = ({ isDarkMode }) => {
  const router = useRouter();

  const handleOpenScanner = () => {
    router.push('/qr-scanner');
  };

  return (
    <Button
      onClick={handleOpenScanner}
      variant="outline"
      size="icon"
      className={`rounded-full h-10 w-10 ${
        isDarkMode 
          ? 'bg-gray-800/90 text-gray-100 border-gray-700 hover:bg-gray-700' 
          : 'bg-white/90 text-gray-800 border-gray-300 hover:bg-gray-100'
      }`}
      title="Scan QR Code"
    >
      <QrCode className="h-5 w-5" />
    </Button>
  );
};
