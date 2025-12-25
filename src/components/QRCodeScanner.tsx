import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Loader2, AlertCircle, ScanLine } from 'lucide-react';
import jsQR from 'jsqr';

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

export function QRCodeScanner({ onScan, onError }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const stopScanning = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code) {
      onScan(code.data);
      stopScanning();
      return;
    }

    animationRef.current = requestAnimationFrame(scanQRCode);
  }, [isScanning, onScan, stopScanning]);

  const startScanning = async () => {
    setIsInitializing(true);
    setError(null);

    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available. Please use a modern browser with HTTPS.');
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      let errorMsg = 'Failed to access camera';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Camera is in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMsg = 'Camera does not meet requirements.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsInitializing(false);
    }
  };

  // Start QR scanning loop when isScanning changes
  useEffect(() => {
    if (isScanning) {
      animationRef.current = requestAnimationFrame(scanQRCode);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isScanning, scanQRCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
          {isScanning ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-primary rounded-lg relative">
                  <ScanLine className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-primary animate-pulse" />
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <Camera className="h-16 w-16 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center px-4">
                Click the button below to start scanning
              </p>
            </div>
          )}
        </div>

        {/* Hidden canvas for QR processing */}
        <canvas ref={canvasRef} className="hidden" />

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
          onClick={isScanning ? stopScanning : startScanning}
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
          Point your camera at the QR code to scan
        </p>
      </CardContent>
    </Card>
  );
}
