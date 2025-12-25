import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, CameraOff, Loader2, AlertCircle, ScanLine, Upload, ImageIcon } from 'lucide-react';
import jsQR from 'jsqr';

interface QRCodeScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

export function QRCodeScanner({ onScan, onError }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available. Please use a modern browser with HTTPS.');
      }

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
        errorMsg = 'Camera permission denied. Please allow camera access or use the Upload tab.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera found. Please use the Upload tab instead.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Camera is in use. Please use the Upload tab instead.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setError(null);

    try {
      const image = new Image();
      const reader = new FileReader();

      reader.onload = () => {
        image.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            setError('Failed to process image');
            setIsProcessingImage(false);
            return;
          }

          canvas.width = image.width;
          canvas.height = image.height;
          ctx.drawImage(image, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code) {
            onScan(code.data);
          } else {
            setError('No QR code found in the image. Please try another image.');
          }
          setIsProcessingImage(false);
        };

        image.onerror = () => {
          setError('Failed to load image');
          setIsProcessingImage(false);
        };

        image.src = reader.result as string;
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setIsProcessingImage(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
      setIsProcessingImage(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  // Stop camera when switching tabs
  useEffect(() => {
    if (activeTab === 'upload') {
      stopScanning();
    }
  }, [activeTab, stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'camera' | 'upload')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="camera" className="gap-2">
              <Camera className="h-4 w-4" />
              Camera
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="mt-4 space-y-4">
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
          </TabsContent>

          <TabsContent value="upload" className="mt-4 space-y-4">
            <div 
              className="w-full aspect-square rounded-lg bg-muted flex flex-col items-center justify-center gap-4 border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-16 w-16 text-muted-foreground" />
              <div className="text-center px-4">
                <p className="text-sm font-medium">Click to upload QR code image</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports JPG, PNG, GIF
                </p>
              </div>
            </div>

            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <Button
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingImage}
            >
              {isProcessingImage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing image...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Select Image
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Hidden canvas for QR processing */}
        <canvas ref={canvasRef} className="hidden" />

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          {activeTab === 'camera' 
            ? 'Point your camera at the QR code to scan'
            : 'Upload a screenshot or photo of the QR code'}
        </p>
      </CardContent>
    </Card>
  );
}
