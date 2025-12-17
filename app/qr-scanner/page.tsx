
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, QrCode, X, Camera, Upload } from 'lucide-react';

export default function QRScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt" | null>(null);
  const router = useRouter();

  // Check if device is mobile and camera permissions
  useEffect(() => {
    const checkMobileAndPermissions = async () => {
      // Check if device is mobile
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      // More comprehensive mobile detection
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      // Also check for touch capability which is common on mobile
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Detect specific platform for platform-specific optimizations
      const isIOS = /ipad|iphone|ipod/i.test(userAgent);
      const isAndroid = /android/i.test(userAgent);

      setIsMobile(isMobileDevice || hasTouchScreen);
      
      // Store platform info for use in other parts of the component
      (window as any).isIOS = isIOS;
      (window as any).isAndroid = isAndroid;

      // Check camera permissions
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setCameraPermission(result.state as "granted" | "denied" | "prompt");
          result.addEventListener('change', () => {
            setCameraPermission(result.state as "granted" | "denied" | "prompt");
          });
        }
      } catch (err) {
        console.log('Permissions API not available');
      }
    };

    checkMobileAndPermissions();
  }, []);

  useEffect(() => {
    // We'll load the QR scanner library dynamically to avoid SSR issues
    const loadQRScanner = async () => {
      try {
        // Dynamically import qr-scanner
        const QrScanner = (await import('qr-scanner')).default;

        // For mobile devices, assume camera is available and try to access it directly
        // For desktop, check camera availability first
        let hasCamera = true;
        let cameraCheckError = null;

        try {
          if (!isMobile) {
            hasCamera = await QrScanner.hasCamera();
          }
        } catch (err) {
          console.error('Error checking camera availability:', err);
          cameraCheckError = err;
          // Don't set hasCamera to false for mobile devices even if check fails
          if (!isMobile) {
            hasCamera = false;
          }
        }

        setHasCamera(hasCamera);

        if (!hasCamera && !isMobile) {
          setError('No camera detected on this device. You can upload an image with a QR code instead.');
          setIsLoading(false);
          return;
        }

        if (videoRef.current) {
          // Configure scanner based on device type
          // On mobile, prefer the back camera (environment) which is better for QR scanning
          // On desktop, let the library choose the best camera
          const preferredCamera = isMobile ? 'environment' : undefined;

          // Set up video element with mobile-friendly attributes
          videoRef.current.setAttribute('playsinline', ''); // Important for iOS
          videoRef.current.setAttribute('muted', ''); // Muted autoplay is more likely to work
          
          // Platform-specific video attributes
          if ((window as any).isIOS) {
            videoRef.current.setAttribute('autoplay', ''); // iOS requires autoplay
            videoRef.current.style.objectFit = 'cover'; // Better video display on iOS
          } else if ((window as any).isAndroid) {
            videoRef.current.style.transform = 'scaleX(-1)'; // Mirror video for better UX on Android
          }

          // Platform-specific scanner options
          let scannerOptions = {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: preferredCamera,
            // For mobile devices, set max scan frequency to reduce CPU usage
            maxScansPerSecond: isMobile ? 5 : 10,
            // Add mobile-specific options
            returnDetailedScanResult: true,
            calculateScanRegion: (video: HTMLVideoElement) => {
              // Platform-specific scan region
              let scanRegionSize: number;
              
              if ((window as any).isIOS) {
                // Smaller scan region for iOS to improve performance
                const smallestDimension = Math.min(video.videoWidth, video.videoHeight);
                scanRegionSize = Math.round(0.5 * smallestDimension);
              } else if ((window as any).isAndroid) {
                // Slightly larger scan region for Android
                const smallestDimension = Math.min(video.videoWidth, video.videoHeight);
                scanRegionSize = Math.round(0.7 * smallestDimension);
              } else {
                // Default scan region for desktop
                const smallestDimension = Math.min(video.videoWidth, video.videoHeight);
                scanRegionSize = Math.round(0.6 * smallestDimension);
              }
              
              return {
                x: Math.round((video.videoWidth - scanRegionSize) / 2),
                y: Math.round((video.videoHeight - scanRegionSize) / 2),
                width: scanRegionSize,
                height: scanRegionSize,
              };
            }
          };

          const qrScanner = new QrScanner(
            videoRef.current,
            (result) => {
              console.log('decoded qr code:', result);
              setQrCode(result.data);
              setScannerActive(false);
              qrScanner.stop();
            },
            scannerOptions
          );

          // Store the scanner instance for cleanup
          scannerRef.current = qrScanner;

          try {
            await qrScanner.start();
            setScannerActive(true);
            setIsLoading(false);
          } catch (err) {
            console.error('Error starting camera:', err);
            let errorMessage = '';

            if (isMobile) {
              if (err instanceof Error && err.name === 'NotAllowedError') {
                errorMessage = 'Camera access was denied. Please allow camera access in your browser settings and refresh the page. You can also:';
              } else if (err instanceof Error && err.name === 'NotFoundError') {
                errorMessage = 'No camera found on your device. You can:';
              } else if (err instanceof Error && err.name === 'NotSupportedError') {
                errorMessage = 'Your browser doesn\'t support camera access. Try using a different browser. You can also:';
              } else {
                errorMessage = 'Unable to access camera on your mobile device. This can happen due to browser restrictions or permission settings. You can:';
              }
            } else {
              errorMessage = 'Failed to access camera. Please ensure camera permissions are granted. ';
            }

            errorMessage += 'You can also upload an image with a QR code instead.';
            setError(errorMessage);
            setIsLoading(false);
          }

          return () => {
            qrScanner.stop();
            scannerRef.current = null;
          };
        }
      } catch (err) {
        console.error('Error loading QR Scanner:', err);
        setError('Failed to load QR scanner. You can upload an image with a QR code instead.');
        setIsLoading(false);
      }
    };

    const cleanup = loadQRScanner();

    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [isMobile]);

  const handleScanAgain = () => {
    setQrCode(null);
    setError(null);
    setIsLoading(true);
    setScannerActive(false);

    // Restart the scanner
    const restartScanner = async () => {
      try {
        const QrScanner = (await import('qr-scanner')).default;

        if (videoRef.current) {
          const preferredCamera = isMobile ? 'environment' : undefined;

          // Set up video element with mobile-friendly attributes
          videoRef.current.setAttribute('playsinline', ''); // Important for iOS
          videoRef.current.setAttribute('muted', ''); // Muted autoplay is more likely to work
          
          // Platform-specific video attributes
          if ((window as any).isIOS) {
            videoRef.current.setAttribute('autoplay', ''); // iOS requires autoplay
            videoRef.current.style.objectFit = 'cover'; // Better video display on iOS
          } else if ((window as any).isAndroid) {
            videoRef.current.style.transform = 'scaleX(-1)'; // Mirror video for better UX on Android
          }

          // Platform-specific scanner options
          let scannerOptions = {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: preferredCamera,
            // For mobile devices, set max scan frequency to reduce CPU usage
            maxScansPerSecond: isMobile ? 5 : 10,
            // Add mobile-specific options
            returnDetailedScanResult: true,
            calculateScanRegion: (video: HTMLVideoElement) => {
              // Platform-specific scan region
              let scanRegionSize: number;
              
              if ((window as any).isIOS) {
                // Smaller scan region for iOS to improve performance
                const smallestDimension = Math.min(video.videoWidth, video.videoHeight);
                scanRegionSize = Math.round(0.5 * smallestDimension);
              } else if ((window as any).isAndroid) {
                // Slightly larger scan region for Android
                const smallestDimension = Math.min(video.videoWidth, video.videoHeight);
                scanRegionSize = Math.round(0.7 * smallestDimension);
              } else {
                // Default scan region for desktop
                const smallestDimension = Math.min(video.videoWidth, video.videoHeight);
                scanRegionSize = Math.round(0.6 * smallestDimension);
              }
              
              return {
                x: Math.round((video.videoWidth - scanRegionSize) / 2),
                y: Math.round((video.videoHeight - scanRegionSize) / 2),
                width: scanRegionSize,
                height: scanRegionSize,
              };
            }
          };

          const qrScanner = new QrScanner(
            videoRef.current,
            (result) => {
              console.log('decoded qr code:', result);
              setQrCode(result.data);
              setScannerActive(false);
              qrScanner.stop();
            },
            scannerOptions
          );

          try {
            await qrScanner.start();
            setScannerActive(true);
            setIsLoading(false);
          } catch (err) {
            console.error('Error restarting camera:', err);
            let errorMessage = '';

            if (isMobile) {
              errorMessage = 'Unable to access camera on your mobile device. This can happen due to browser restrictions or permission settings. You can:';
            } else {
              errorMessage = 'Failed to access camera. Please ensure camera permissions are granted. ';
            }

            errorMessage += 'You can also upload an image with a QR code instead.';
            setError(errorMessage);
            setIsLoading(false);
          }

          return () => {
            qrScanner.stop();
            scannerRef.current = null;
          };
        }
      } catch (err) {
        console.error('Error restarting QR Scanner:', err);
        setError('Failed to restart QR scanner.');
        setIsLoading(false);
      }
    };

    const cleanup = restartScanner();

    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      try {
        const QrScanner = (await import('qr-scanner')).default;
        const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
        if (result && result.data) {
          setQrCode(result.data);
        } else {
          setError('No QR code found in the uploaded image. Please try another image.');
        }
      } catch (err) {
        console.error('Error scanning image:', err);
        setError('Failed to scan the image. Please ensure it contains a valid QR code.');
      }
    }
  };

  const handleRedirect = () => {
    if (qrCode) {
      // If the QR code is a URL, navigate to it
      if (qrCode.startsWith('http://') || qrCode.startsWith('https://')) {
        window.location.href = qrCode;
      } else {
        // Otherwise, you could handle it as needed (e.g., process ticket ID)
        router.push(`/ticket/${qrCode}`);
      }
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const requestCameraPermission = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Platform-specific camera constraints
      let constraints = { video: true };
      
      if ((window as any).isIOS) {
        // iOS specific constraints
        constraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        };
      } else if ((window as any).isAndroid) {
        // Android specific constraints
        constraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
      }
      
      // Request camera permissions explicitly with platform-specific constraints
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      
      // Permission granted, try to initialize the scanner
      setCameraPermission("granted");
      setIsLoading(false);
      
      // Trigger a re-render to initialize the scanner with new permission
      const event = new Event("permissionchange");
      window.dispatchEvent(event);
    } catch (err) {
      console.error("Error requesting camera permission:", err);
      let errorMessage = "";
      
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          if ((window as any).isIOS) {
            errorMessage = "Camera access was denied. On iOS, go to Settings > Safari > Camera and allow access. Then refresh the page.";
          } else if ((window as any).isAndroid) {
            errorMessage = "Camera access was denied. On Android, tap the lock icon in the address bar and allow camera access. Then refresh the page.";
          } else {
            errorMessage = "Camera access was denied. Please allow camera access in your browser settings and refresh the page.";
          }
        } else if (err.name === "NotFoundError") {
          errorMessage = "No camera found on your device.";
        } else if (err.name === "NotSupportedError") {
          if ((window as any).isIOS) {
            errorMessage = "Your browser doesn\'t support camera access. On iOS, please use Safari browser for best results.";
          } else {
            errorMessage = "Your browser doesn\'t support camera access. Try using a different browser.";
          }
        } else {
          errorMessage = `Failed to access camera: ${err.message}`;
        }
      } else {
        errorMessage = "Failed to access camera. Please check your browser settings."; 
      }
      
      setError(errorMessage);
      setCameraPermission("denied");
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code Scanner
          </CardTitle>
          <CardDescription>
            {isMobile ? 
              "Position the QR code within the frame to scan or upload an image" :
              (hasCamera ? "Position the QR code within the frame to scan or upload an image" : "Upload an image containing a QR code to scan")
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Initializing camera...</p>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-center py-4">
              <p>{error}</p>
              <div className="flex gap-2 mt-4 justify-center flex-wrap">
                {hasCamera && cameraPermission !== "granted" && (
                  <Button onClick={requestCameraPermission} size="sm">
                    <Camera className="h-4 w-4 mr-1" />
                    Request Camera Permission
                  </Button>
                )}
                {hasCamera && cameraPermission === "granted" && (
                  <Button onClick={handleScanAgain} size="sm">
                    <Camera className="h-4 w-4 mr-1" />
                    Try Camera Again
                  </Button>
                )}
                <Button onClick={triggerFileInput} variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  Upload Image
                </Button>
              </div>
            </div>
          )}

          <div className="relative">
            <video
              ref={videoRef}
              className={`w-full rounded-lg ${isLoading || error || (!hasCamera && !isMobile) ? 'hidden' : ''}`}
            />

            {qrCode && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
                <div className="bg-white p-4 rounded-lg max-w-xs">
                  <p className="text-sm font-medium mb-2">QR Code Detected:</p>
                  <p className="text-xs break-all mb-4">{qrCode}</p>
                  <div className="flex gap-2">
                    <Button onClick={handleRedirect} size="sm" className="flex-1">
                      Process
                    </Button>
                    <Button onClick={handleScanAgain} size="sm" variant="outline" className="flex-1">
                      Scan Again
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Hidden file input for image upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {!isLoading && !error && !qrCode && (
            <div className="text-center text-sm text-muted-foreground">
              {scannerActive ? 'Scanning for QR codes...' : 'Camera is not active'}
              {(hasCamera || isMobile) && (
                <div className="mt-4 flex gap-2 justify-center flex-wrap">
                  {cameraPermission !== "granted" && (
                    <Button onClick={requestCameraPermission} variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-1" />
                      Request Camera Permission
                    </Button>
                  )}
                  <Button onClick={triggerFileInput} variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-1" />
                    Upload Image Instead
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center pt-2">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
