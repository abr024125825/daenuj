import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Loader2 } from 'lucide-react';

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

export function QRCodeScanner({ onScan, onError }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    if (!containerRef.current) return;
    
    setIsInitializing(true);
    setError(null);

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Ignore scan errors (no QR code found)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to start camera';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsInitializing(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div
          id="qr-reader"
          ref={containerRef}
          className="w-full aspect-square rounded-lg overflow-hidden bg-muted"
          style={{ display: isScanning ? 'block' : 'none' }}
        />

        {!isScanning && (
          <div className="w-full aspect-square rounded-lg bg-muted flex flex-col items-center justify-center gap-4">
            <Camera className="h-16 w-16 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Click the button below to start scanning
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
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
      </CardContent>
    </Card>
  );
}
