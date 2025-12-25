import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Loader2, AlertCircle } from 'lucide-react';

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

export function QRCodeScanner({ onScan, onError }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraList, setCameraList] = useState<any[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerIdRef = useRef(`qr-reader-${Date.now()}`);

  const getCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameraList(devices);
      return devices;
    } catch (err) {
      console.error('Error getting cameras:', err);
      return [];
    }
  };

  const startScanner = async () => {
    if (!containerRef.current) return;
    
    setIsInitializing(true);
    setError(null);

    try {
      // First request camera permission explicitly
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (permErr: any) {
        if (permErr.name === 'NotAllowedError') {
          throw new Error('Camera permission denied. Please allow camera access in your browser settings.');
        }
        throw permErr;
      }

      // Get available cameras
      const cameras = await getCameras();
      
      if (cameras.length === 0) {
        throw new Error('No cameras found on this device.');
      }

      // Stop any existing scanner
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          // Ignore
        }
        scannerRef.current = null;
      }

      const scanner = new Html5Qrcode(scannerIdRef.current);
      scannerRef.current = scanner;

      // Try to use back camera first, fallback to first available
      const backCamera = cameras.find((c: any) => 
        c.label?.toLowerCase().includes('back') || 
        c.label?.toLowerCase().includes('environment')
      );
      
      const cameraConfig = backCamera 
        ? { deviceId: backCamera.id }
        : { facingMode: 'environment' };

      await scanner.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 200, height: 200 },
          aspectRatio: 1,
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {
          // QR code not found - ignore
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Scanner error:', err);
      let errorMsg = 'Failed to start camera';
      
      if (err.message) {
        errorMsg = err.message;
      } else if (err.name === 'NotReadableError') {
        errorMsg = 'Camera is in use by another application. Please close other apps using the camera.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No camera found on this device.';
      } else if (err.name === 'NotAllowedError') {
        errorMsg = 'Camera permission denied. Please allow camera access.';
      } else if (err.name === 'OverconstrainedError') {
        errorMsg = 'Camera constraints could not be satisfied.';
      }
      
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsInitializing(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div
          id={scannerIdRef.current}
          ref={containerRef}
          className="w-full aspect-square rounded-lg overflow-hidden bg-muted"
          style={{ 
            display: isScanning ? 'block' : 'none',
            minHeight: '250px'
          }}
        />

        {!isScanning && (
          <div className="w-full aspect-square rounded-lg bg-muted flex flex-col items-center justify-center gap-4 min-h-[250px]">
            <Camera className="h-16 w-16 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center px-4">
              Click the button below to start the camera scanner
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Camera Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <Button
          className="w-full"
          onClick={isScanning ? stopScanner : startScanner}
          disabled={isInitializing}
        >
          {isInitializing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Starting camera...
            </>
          ) : isScanning ? (
            <>
              <CameraOff className="h-4 w-4 mr-2" />
              Stop Scanner
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Start Scanner
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Make sure to allow camera access when prompted
        </p>
      </CardContent>
    </Card>
  );
}
