'use client';

import React, { useEffect, useRef, useState } from 'react';

// Hook to save and restore active tab to/from localStorage
const usePersistedTab = (activeTab: TabType, setActiveTab: (tab: TabType) => void, isTabInitialized: boolean, setIsTabInitialized: (value: boolean) => void) => {
    // Initialize tab from localStorage on client side
    useEffect(() => {
        if (typeof window !== 'undefined' && !isTabInitialized) {
            const savedTab = localStorage.getItem('qr-scanner-active-tab');
            if (savedTab === 'checkin' || savedTab === 'checkout' || savedTab === 'attendees') {
                setActiveTab(savedTab as TabType);
            }
            setIsTabInitialized(true);
        }
    }, [isTabInitialized, setActiveTab]);

    // Save tab to localStorage when it changes
    useEffect(() => {
        if (typeof window !== 'undefined' && isTabInitialized) {
            localStorage.setItem('qr-scanner-active-tab', activeTab);
        }
    }, [activeTab, isTabInitialized]);
};
import { useRouter } from 'next/navigation';
import { Camera, ArrowLeft, Check, AlertCircle, RefreshCw, Users, Settings, LogIn, LogOut, Home } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { createClient } from '@supabase/supabase-js';

type TabType = 'checkin' | 'checkout' | 'attendees';

export default function QRScannerPage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);

    // Initialize with default tab
    const [activeTab, setActiveTab] = useState<TabType>('checkin');
    const [isTabInitialized, setIsTabInitialized] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [checkInMessage, setCheckInMessage] = useState<string>('');
    const [checkInSuccess, setCheckInSuccess] = useState<boolean>(false);

    // Attendees tab state
    const [seats, setSeats] = useState<any[]>([]);
    const [loadingSeats, setLoadingSeats] = useState(true);
    const [checkedInExpanded, setCheckedInExpanded] = useState(true);
    const [notCheckedInExpanded, setNotCheckedInExpanded] = useState(false);

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Use either the PUBLISHABLE_KEY or ANON_KEY
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const supabase = createClient(
        supabaseUrl || '',
        supabaseKey || ''
    );
    const [hasCamera, setHasCamera] = useState(true);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    
    // Use the custom hook to persist the active tab
    usePersistedTab(activeTab, setActiveTab, isTabInitialized, setIsTabInitialized);

    useEffect(() => {
        // Clean up any existing scanner before initializing
        if (qrScannerRef.current) {
            qrScannerRef.current.stop();
            qrScannerRef.current.destroy();
            qrScannerRef.current = null;
        }

        if (activeTab === 'checkin' || activeTab === 'checkout') {
            initScanner();
        } else {
            // Stop scanner when not on scanning tabs
            setScanning(false);
        }

        return () => {
            if (qrScannerRef.current) {
                qrScannerRef.current.stop();
                qrScannerRef.current.destroy();
                qrScannerRef.current = null;
            }
        };
    }, [activeTab]);

    // Fetch seats for attendees tab
    useEffect(() => {
        const fetchSeats = async () => {
            try {
                const { data, error } = await supabase
                    .from('seats')
                    .select(`
                        id,
                        seat_number,
                        check_in:"Check-in",
                        "last Check-in",
                        booking_id,
                        row_id,
                        bookings (
                            name,
                            email,
                            phone
                        )
                    `)
                    .not('booking_id', 'is', null)
                    .order('"Check-in"', { ascending: false })
                    .order('seat_number', { ascending: true });

                // Fetch row and zone information separately
                if (data && data.length > 0) {
                    // Get all unique row_ids
                    const rowIds = [...new Set(data.map(seat => seat.row_id).filter(Boolean))];

                    if (rowIds.length > 0) {
                        // Fetch rows with their zones
                        const { data: rowsData, error: rowsError } = await supabase
                            .from('rows')
                            .select(`
                                id,
                                row_number,
                                zones (
                                    name
                                )
                            `)
                            .in('id', rowIds);

                        if (!rowsError && rowsData) {
                            // Create a map of row_id to row data
                            const rowMap: {[key: string]: any} = rowsData.reduce((acc, row) => {
                                acc[row.id] = row;
                                return acc;
                            }, {} as {[key: string]: any});

                            // Attach row data to each seat
                            data.forEach((seat: any) => {
                                if (seat.row_id && rowMap[seat.row_id]) {
                                    seat.rows = rowMap[seat.row_id];
                                }
                            });
                        }
                    }
                }

                if (error) {
                    console.error('Error fetching seats:', JSON.stringify(error, null, 2));
                    console.error('Error details:', error.message, error.hint, error.details);
                } else {
                    console.log('Seats data:', data);
                    if (data && data.length > 0) {
                        console.log('First seat structure:', JSON.stringify(data[0], null, 2));
                        console.log('First seat check_in type:', typeof data[0].check_in);
                        console.log('First seat check_in value:', data[0].check_in);
                    }
                    setSeats(data || []);
                }
            } catch (err) {
                console.error('Error in fetchSeats:', err);
            } finally {
                setLoadingSeats(false);
            }
        };

        if (activeTab === 'attendees') {
            setLoadingSeats(true);
            fetchSeats();
            // Refresh every 5 seconds
            const interval = setInterval(fetchSeats, 5000);
            return () => clearInterval(interval);
        }
    }, [activeTab]);

    const initScanner = async () => {
        if (!videoRef.current) return;

        // Reset scanning state
        setScanning(false);
        setError('');

        try {
            // Check if camera is available
            const hasCamera = await QrScanner.hasCamera();
            setHasCamera(hasCamera);

            if (!hasCamera) {
                setError('No camera found on this device');
                return;
            }

            // Create QR Scanner instance
            const qrScanner = new QrScanner(
                videoRef.current,
                async (result) => {
                    setResult(result.data);
                    qrScanner.stop();
                    setScanning(false);

                    // If on checkin tab, call the check_in function
                    if (activeTab === 'checkin') {
                        try {
                            // Call the check_in database function with seat UUID
                            const { data, error } = await supabase.rpc('check_in', {
                                seat_uuid: result.data
                            });

                            if (error) {
                                console.error('Error checking in:', error);
                                setCheckInMessage(error.message || 'Failed to check in. Please try again.');
                                setCheckInSuccess(false);
                            } else {
                                setCheckInMessage('Successfully checked in!');
                                setCheckInSuccess(true);
                            }
                        } catch (err) {
                            console.error('Error calling check_in function:', err);
                            setCheckInMessage('An unexpected error occurred. Please try again.');
                            setCheckInSuccess(false);
                        }
                    } else if (activeTab === 'checkout') {
                        try {
                            // Call the check_out database function with seat UUID
                            const { data, error } = await supabase.rpc('check_out', {
                                seat_uuid: result.data
                            });

                            if (error) {
                                console.error('Error checking out:', error);
                                setCheckInMessage(error.message || 'Failed to check out. Please try again.');
                                setCheckInSuccess(false);
                            } else {
                                setCheckInMessage('Successfully checked out!');
                                setCheckInSuccess(true);
                            }
                        } catch (err) {
                            console.error('Error calling check_out function:', err);
                            setCheckInMessage('An unexpected error occurred. Please try again.');
                            setCheckInSuccess(false);
                        }
                    }
                },
                {
                    returnDetailedScanResult: true,
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                    preferredCamera: facingMode,
                }
            );

            qrScannerRef.current = qrScanner;

            // Start scanning
            await qrScanner.start();
            setScanning(true);
            setError('');
        } catch (err) {
            console.error('Scanner initialization error:', err);
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    setError('Camera permission denied. Please allow camera access to scan QR codes.');
                } else if (err.name === 'NotFoundError') {
                    setError('No camera found on this device.');
                } else if (err.name === 'NotReadableError') {
                    setError('Camera is already in use by another application.');
                } else {
                    setError('Failed to access camera. Please try again.');
                }
            } else {
                setError('An unexpected error occurred.');
            }
            setScanning(false);
        }
    };

    const handleScanAgain = async () => {
        setResult('');
        setError('');
        setCheckInMessage('');
        setCheckInSuccess(false);

        // Destroy the old scanner instance and create a new one
        if (qrScannerRef.current) {
            qrScannerRef.current.destroy();
            qrScannerRef.current = null;
        }

        // Force a tab switch to reset the scanner
        const currentTab = activeTab;
        setActiveTab('attendees');

        // Wait a moment for the cleanup to complete
        setTimeout(async () => {
            // Switch back to the original tab
            setActiveTab(currentTab);
        }, 100);
    };

    const handleFlipCamera = async () => {
        // Stop current scanner
        if (qrScannerRef.current) {
            qrScannerRef.current.stop();
            qrScannerRef.current.destroy();
            qrScannerRef.current = null;
        }

        // Toggle camera mode
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');

        // Re-initialize scanner with new camera mode
        setTimeout(async () => {
            await initScanner();
        }, 100);
    };

    const getTabColor = () => {
        return activeTab === 'checkin' ? 'green' : 'red';
    };

    const getTabIcon = () => {
        return activeTab === 'checkin' ? <LogIn className="h-6 w-6" /> : <LogOut className="h-6 w-6" />;
    };

    const getTabTitle = () => {
        return activeTab === 'checkin' ? 'Check In' : 'Check Out';
    };

    const renderScannerTab = () => {
        return (
            <div className="flex flex-col h-full px-4 pt-4">
                {/* Status Card */}
                <div className={`text-center py-6 px-6 rounded-2xl bg-${getTabColor()}-500 text-white shadow-lg mb-6 mx-auto max-w-sm w-full`}>
                    <div className="flex items-center justify-center gap-3 mb-3">
                        {getTabIcon()}
                        <h1 className="text-2xl font-bold">{getTabTitle()}</h1>
                    </div>
                    <p className="text-sm opacity-90">
                        {scanning ? `Scanning for ${getTabTitle().toLowerCase()}...` : 'Ready to scan'}
                    </p>
                </div>

                {/* Camera Preview */}
                <div className="flex-1 relative flex items-center justify-center pb-6">
                    {!result && !error && (
                        <div className="relative w-72 h-72 bg-black rounded-3xl overflow-hidden shadow-2xl">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                playsInline
                                muted
                            />

                            {/* Scanning Overlay - covers the entire video */}
                            {scanning && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {/* Animated corners - positioned at the edges of the scan area */}
                                    <div className={`absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 border-${getTabColor()}-500 rounded-tl-xl animate-pulse`} />
                                    <div className={`absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 border-${getTabColor()}-500 rounded-tr-xl animate-pulse`} />
                                    <div className={`absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 border-${getTabColor()}-500 rounded-bl-xl animate-pulse`} />
                                    <div className={`absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 border-${getTabColor()}-500 rounded-br-xl animate-pulse`} />

                                    {/* Scanning line animation */}
                                    <div className={`absolute top-6 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-${getTabColor()}-500 to-transparent animate-scan`} />
                                </div>
                            )}

                            {/* Loading indicator */}
                            {!scanning && hasCamera && !error && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                                    <div className="text-white text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-3" />
                                        <p className="font-medium">Initializing camera...</p>
                                    </div>
                                </div>
                            )}

                            {/* Flip Camera Button */}
                            <button
                                onClick={handleFlipCamera}
                                disabled={!scanning || !hasCamera}
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </button>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="h-full flex items-center justify-center p-6">
                            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-8 text-center shadow-lg max-w-sm w-full">
                                <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                                    <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                    Camera Error
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-6">
                                    {error}
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-3 px-6 rounded-xl transition-all"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Result Display */}
                    {result && (
                        <div className="flex-1 flex items-center justify-center px-4 pb-6">
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full">
                                {/* Success Animation */}
                                <div className="relative mb-6">
                                    <div className={`absolute inset-0 bg-${getTabColor()}-100 dark:bg-${getTabColor()}-900/30 rounded-full animate-ping opacity-20`} />
                                    <div className={`relative bg-${getTabColor()}-100 dark:bg-${getTabColor()}-900/30 rounded-full p-4 mx-auto w-20 h-20 flex items-center justify-center`}>
                                        <Check className={`h-12 w-12 text-${getTabColor()}-500 dark:text-${getTabColor()}-400`} />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                                    {checkInSuccess ? 'Check-in Successful!' : 'Check-in Failed'}
                                </h3>

                                {/* Check-in Message */}
                                {checkInMessage && (
                                    <div className={`rounded-xl p-4 mb-6 border ${checkInSuccess ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
                                        <p className={`text-sm ${checkInSuccess ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                            {checkInMessage}
                                        </p>
                                    </div>
                                )}

                                {/* Result Content - Only show seat ID if check-in was successful */}
                                {checkInSuccess && (
                                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                                            Seat ID:
                                        </p>
                                        <p className="text-gray-900 dark:text-white break-all font-mono text-sm">
                                            {result}
                                        </p>
                                    </div>
                                )}

                                {/* Action Button */}
                                <button
                                    onClick={handleScanAgain}
                                    className={`w-full bg-gradient-to-r from-${getTabColor()}-500 to-${getTabColor()}-600 hover:from-${getTabColor()}-600 hover:to-${getTabColor()}-700 text-white font-medium py-4 px-6 rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-lg`}
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderAttendeesTab = () => {
        const checkedInSeats = seats.filter(seat => seat.check_in === true);
        const notCheckedInSeats = seats.filter(seat => seat.check_in === false || seat.check_in === null);
        const totalSeats = seats.length;
        const checkedInCount = checkedInSeats.length;
        const notCheckedInCount = notCheckedInSeats.length;
        
        // Calculate seats with and without "last Check-in"
        const seatsWithLastCheckIn = seats.filter(seat => seat["last Check-in"] !== null);
        const seatsWithoutLastCheckIn = seats.filter(seat => seat["last Check-in"] === null);

        return (
            <div className="flex flex-col h-full p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="h-6 w-6 text-indigo-600" />
                    <h1 className="text-2xl font-bold">Attendee List</h1>
                </div>

                {/* Summary Widgets */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-2.5 shadow-lg">
                        <div className="text-center">
                            <div className="text-xl font-bold mb-0.5">
                                {checkedInCount} <span className="text-sm opacity-80">/ {totalSeats}</span>
                            </div>
                            <div className="text-xs opacity-90">
                                Checked In
                            </div>
                            <div className="mt-1.5 bg-white/20 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-white h-full transition-all duration-500 ease-out"
                                    style={{ width: `${totalSeats > 0 ? (checkedInCount / totalSeats) * 100 : 0}%` }}
                                />
                            </div>
                            <div className="mt-1 text-xs opacity-75">
                                {totalSeats > 0 ? Math.round((checkedInCount / totalSeats) * 100) : 0}%
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-2.5 shadow-lg">
                        <div className="text-center">
                            <div className="text-xl font-bold mb-0.5">
                                {seatsWithoutLastCheckIn.length} <span className="text-sm opacity-80"></span>
                            </div>
                            <div className="text-xs opacity-90">
                                Not Arrived
                            </div>
                            <div className="mt-1.5 bg-white/20 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-white h-full transition-all duration-500 ease-out"
                                    style={{ width: `${seatsWithLastCheckIn.length > 0 ? (seatsWithoutLastCheckIn.length / (seatsWithLastCheckIn.length + seatsWithoutLastCheckIn.length)) * 100 : 0}%` }}
                                />
                            </div>
                            <div className="mt-1 text-xs opacity-75">
                                {seatsWithLastCheckIn.length > 0 ? Math.round((seatsWithoutLastCheckIn.length / (seatsWithLastCheckIn.length + seatsWithoutLastCheckIn.length)) * 100) : 0}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendees List */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-auto">
                    {loadingSeats ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4" />
                            <p className="text-gray-500">Loading attendees...</p>
                        </div>
                    ) : totalSeats === 0 ? (
                        <div className="text-center py-12 px-4">
                            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No attendees found</p>
                            <p className="text-sm text-gray-400 mt-2">Attendees will appear here after booking</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {/* Checked In Section */}
                            <div>
                                <button
                                    onClick={() => setCheckedInExpanded(!checkedInExpanded)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2">
                                            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                Checked In
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {checkedInCount} attendee{checkedInCount !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <svg
                                        className={`h-5 w-5 text-gray-400 transition-transform ${checkedInExpanded ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {checkedInExpanded && (
                                    <div className="bg-gray-50 dark:bg-gray-900/30">
                                        {checkedInSeats.length === 0 ? (
                                            <div className="px-6 py-8 text-center text-gray-500 text-sm">
                                                No attendees checked in yet
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-200 dark:divide-gray-700/50">
                                                {checkedInSeats.map((seat) => (
                                                    <div key={seat.id} className="px-4 py-3 hover:bg-white dark:hover:bg-gray-800/50 transition-colors">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                                                    {seat.bookings?.name || 'Unknown'}
                                                                </p>
                                                                {seat.bookings?.phone && (
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                                        {seat.bookings.phone}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex-shrink-0 ml-3 text-right">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {seat.rows?.zones?.name} • {seat.rows?.row_number} • {seat.seat_number}
                                                                </p>
                                                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                                                    <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-0.5">
                                                                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                                                    </div>
                                                                    <span className="text-xs text-green-600 dark:text-green-400">
                                                                        Arrived at {new Date(seat["last Check-in"]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Not Checked In Section */}
                            <div>
                                <button
                                    onClick={() => setNotCheckedInExpanded(!notCheckedInExpanded)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-2">
                                            <AlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                Not Checked In
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {notCheckedInSeats.length} attendee{notCheckedInSeats.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <svg
                                        className={`h-5 w-5 text-gray-400 transition-transform ${notCheckedInExpanded ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {notCheckedInExpanded && (
                                    <div className="bg-gray-50 dark:bg-gray-900/30">
                                        {notCheckedInSeats.length === 0 ? (
                                            <div className="px-6 py-8 text-center text-gray-500 text-sm">
                                                All attendees are checked in!
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-200 dark:divide-gray-700/50">
                                                {notCheckedInSeats.map((seat) => (
                                                    <div key={seat.id} className="px-4 py-3 hover:bg-white dark:hover:bg-gray-800/50 transition-colors">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                                                    {seat.bookings?.name || 'Unknown'}
                                                                </p>
                                                                {seat.bookings?.phone && (
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                                        {seat.bookings.phone}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex-shrink-0 ml-3 text-right">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {seat.rows?.zones?.name} • {seat.rows?.row_number} • {seat.seat_number}
                                                                </p>
                                                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                                                    <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-0.5">
                                                                        <AlertCircle className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                                                    </div>
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                                                        {seat["last Check-in"] ? "Arrived at " + new Date(seat["last Check-in"]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not Arrived Yet'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };



    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative">
            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden pb-20">
                {isTabInitialized && (
                    <>
                        {activeTab === 'checkin' && renderScannerTab()}
                        {activeTab === 'checkout' && renderScannerTab()}
                        {activeTab === 'attendees' && renderAttendeesTab()}
                    </>
                )}
                {!isTabInitialized && (
                    <div className="flex h-full items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                    </div>
                )}
            </div>

            {/* Floating Navigation Bar */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-full shadow-2xl px-2 py-2 flex justify-around items-center min-w-[320px] max-w-md border border-gray-200 dark:border-gray-700">
                {/* Check In Tab */}
                <button
                    onClick={() => setActiveTab('checkin')}
                    className={`flex flex-col items-center justify-center p-2 rounded-full transition-all ${activeTab === 'checkin'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 scale-110'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                >
                    <LogIn className="h-6 w-6" />
                </button>

                {/* Check Out Tab */}
                <button
                    onClick={() => setActiveTab('checkout')}
                    className={`flex flex-col items-center justify-center p-2 rounded-full transition-all ${activeTab === 'checkout'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 scale-110'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                >
                    <LogOut className="h-6 w-6" />
                </button>

                {/* Attendees Tab */}
                <button
                    onClick={() => setActiveTab('attendees')}
                    className={`flex flex-col items-center justify-center p-2 rounded-full transition-all ${activeTab === 'attendees'
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 scale-110'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                >
                    <Users className="h-6 w-6" />
                </button>


            </div>

            <style jsx>{`
                @keyframes scan {
                    0% {
                        top: 0;
                    }
                    100% {
                        top: 100%;
                    }
                }
                .animate-scan {
                    animation: scan 2s linear infinite;
                }
            `}</style>
        </div>
    );
}