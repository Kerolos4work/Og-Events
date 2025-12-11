/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import { Upload, X, Image, Loader } from 'lucide-react';

interface FileUploadProps {
  file: File | null;
  isDarkMode: boolean;
  isConverting: boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function FileUpload({ file, isDarkMode, isConverting, handleFileChange }: FileUploadProps) {
  const handleRemoveFile = () => {
    // Create a synthetic event to trigger the handleFileChange with null file
    const syntheticEvent = {
      target: { files: null }
    } as React.ChangeEvent<HTMLInputElement>;
    handleFileChange(syntheticEvent);
  };

  return (
    <div className="mb-4">
      {isConverting ? (
        // Converting state
        <div className={`relative ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-4`}>
          <div className="flex items-center justify-center space-x-3">
            <Loader className={`h-5 w-5 animate-spin ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Converting image...
            </p>
          </div>
        </div>
      ) : file ? (
        // File selected preview
        <div className={`relative ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {file.type.startsWith('image/') ? (
                <div className="relative h-12 w-12 overflow-hidden rounded-md">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className={`flex h-12 w-12 items-center justify-center rounded-md ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                  <Image className={`h-6 w-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} />
                </div>
              )}
              <div className="flex-1 min-w-0 max-w-[120px] sm:max-w-[180px] md:max-w-xs">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} overflow-hidden text-ellipsis whitespace-nowrap`} title={file.name}>
                  {file.name}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
            >
              <X className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>
      ) : (
        // File upload area
        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${isDarkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'} transition-colors`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className={`w-8 h-8 mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`mb-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              PNG, JPG, GIF, HEIC or PDF (MAX. 10MB)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf"
          />
        </label>
      )}
    </div>
  );
}
