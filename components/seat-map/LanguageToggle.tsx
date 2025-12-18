import React, { useState } from 'react';

interface LanguageToggleProps {
  isDarkMode: boolean;
  currentLanguage: string;
  onToggle: () => void;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ isDarkMode, currentLanguage, onToggle }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = () => {
    setIsLoading(true);
    onToggle();
    // Short delay just for visual feedback
    setTimeout(() => setIsLoading(false), 100);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`p-3 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      style={{
        backgroundColor: isDarkMode ? 'rgb(0 0 0 / 0.6)' : 'rgb(255 255 255 / 0.6)',
        color: isDarkMode ? '#ffffff' : '#1f2937',
        backdropFilter: 'blur(24px)',
      }}
      aria-label="Toggle language"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <span className="text-md font-bold">{currentLanguage === 'ar' ? 'EN' : 'AR'}</span>
      )}
    </button>
  );
};

export default LanguageToggle;
