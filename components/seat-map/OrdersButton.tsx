
import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';

interface OrdersButtonProps {
  isDarkMode: boolean;
}

const OrdersButton: React.FC<OrdersButtonProps> = ({ isDarkMode }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push('/orders');
  };

  return (
    <button
      onClick={handleClick}
      className={`p-3 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center`}
      style={{
        backgroundColor: isDarkMode ? 'rgb(0 0 0 / 0.6)' : 'rgb(255 255 255 / 0.6)',
        color: isDarkMode ? '#ffffff' : '#1f2937',
        backdropFilter: 'blur(24px)',
        minWidth: '48px',
        minHeight: '48px',
      }}
      aria-label="View Orders"
    >
      <ShoppingBag size={24} />
    </button>
  );
};

export default OrdersButton;
