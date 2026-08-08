'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, CheckCircle, AlertCircle, Loader2, SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { participantsApi } from '@/lib/api';
import type { VerifyResponse } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CameraDevice {
  id: string;
  label: string;
}

interface ScannerProps {
  onScan?: (result: VerifyResponse) => void;
  isOpen?: boolean;
  onClose?: () => void;
  scannedBy?: string;
}

export function Scanner({ onScan, isOpen = true, onClose, scannedBy }: ScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastResult, setLastResult] = useState<VerifyResponse | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  // Initialize permissions
  useEffect(() => {
    if (isOpen) {
      setHasPermission(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !hasPermission || isScanning) return;

    const startScanner = async () => {
      if (!scannerContainerRef.current) return;

      html5QrcodeRef.current = new Html5Qrcode(scannerContainerRef.current.id);

      try {
        await html5QrcodeRef.current.start(
          { facingMode },
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdgePercentage = 0.7; // 70% of the smallest edge
              const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
              return { width: qrboxSize, height: qrboxSize };
            },
          },
          (decodedText) => {
            handleScanResult(decodedText);
          },
          (error) => {
            // Ignore scanning errors (no QR code found)
          }
        );
        setIsScanning(true);
      } catch (error) {
        console.error('Scanner start error:', error);
        toast.error('Failed to start camera');
      }
    };

    startScanner();

    return () => {
      if (html5QrcodeRef.current && isScanning) {
        html5QrcodeRef.current.stop().catch(console.error);
        setIsScanning(false);
      }
    };
  }, [isOpen, hasPermission, facingMode, isScanning]);

  const handleScanResult = useCallback(async (decodedText: string) => {
    if (isVerifying) return;
    
    // Stop scanner to prevent duplicate scans
    if (html5QrcodeRef.current && isScanning) {
      await html5QrcodeRef.current.stop().catch(console.error);
      setIsScanning(false);
    }

    setIsVerifying(true);
    try {
      const result = await participantsApi.verify(decodedText, scannedBy);
      setLastResult(result);
      setShowResult(true);
      
      if (!result.verified) {
        toast.error(result.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      toast.error(message);
      setLastResult({
        success: false,
        verified: false,
        message,
      });
      setShowResult(true);
    } finally {
      setIsVerifying(false);
      // Restart scanner after 2 seconds
      setTimeout(() => {
        if (isOpen && hasPermission && facingMode) {
          // Scanner will restart via useEffect
        }
      }, 2000);
    }
  }, [isVerifying, isScanning, isOpen, hasPermission, facingMode, onScan]);

  const handleManualVerify = async () => {
    if (!manualCode.trim() || isVerifying) return;
    
    setIsVerifying(true);
    try {
      const result = await participantsApi.verify(manualCode.trim(), scannedBy);
      setLastResult(result);
      setShowResult(true);
      
      if (!result.verified) {
        toast.error(result.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      toast.error(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCheckIn = async (uniqueId: string) => {
    if (isCheckingIn) return;
    setIsCheckingIn(true);
    try {
      const result = await participantsApi.checkIn(uniqueId, scannedBy);
      setLastResult(result);
      onScan?.(result);
      
      if (result.verified) {
        toast.success(result.message);
        setManualCode('');
        // Close modal automatically on success after a short delay
        setTimeout(() => closeResult(), 1500);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Check-in failed';
      toast.error(message);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const closeResult = () => {
    setShowResult(false);
    setLastResult(null);
    // Restart scanner
    if (html5QrcodeRef.current && isScanning) {
      html5QrcodeRef.current.stop().catch(console.error);
      setIsScanning(false);
    }
  };

  // Render logic moved to the bottom

  const renderScannerContent = () => (
    <div className="space-y-6">
        {/* Camera Scanner */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary-600" />
            Camera Scanner
          </h3>
          
          {hasPermission ? (
            <div className="relative">
              <div
                ref={scannerContainerRef}
                id="qr-scanner"
                className="w-full aspect-square bg-gray-900 rounded-xl overflow-hidden"
              />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-4 border-primary-500/50 rounded-lg">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 px-2 py-1 rounded text-xs text-white">
                      Position QR code here
                    </div>
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-lg" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center p-4">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Camera access required</p>
                <p className="text-sm text-gray-400 mt-1">Please allow camera permissions to scan QR codes</p>
              </div>
            </div>
          )}

          <div className="mt-3">
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => {
                // Stop current scanner before switching
                if (html5QrcodeRef.current && isScanning) {
                  html5QrcodeRef.current.stop().then(() => {
                    setIsScanning(false);
                    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
                  }).catch(console.error);
                } else {
                  setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
                }
              }}
            >
              <SwitchCamera className="h-4 w-4 mr-2" />
              Switch to {facingMode === 'environment' ? 'Front Camera' : 'Back Camera'}
            </Button>
          </div>
        </div>

        {/* Manual Entry */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <X className="h-5 w-5 text-gray-500" />
            Manual Entry
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleManualVerify()}
              placeholder="Enter QR Code ID or Unique ID"
              className="input flex-1 text-center text-lg tracking-widest font-mono"
              disabled={isVerifying}
              autoComplete="off"
            />
            <Button
              onClick={handleManualVerify}
              disabled={!manualCode.trim() || isVerifying}
              loading={isVerifying}
              className="whitespace-nowrap"
            >
              Verify
            </Button>
          </div>
        </div>

        {/* Last Result Modal */}
        <Modal
          isOpen={showResult}
          onClose={closeResult}
          title={lastResult?.verified ? 'Participant Found' : 'Access Denied'}
          size="md"
          showCloseButton
          closeOnOverlayClick={false}
        >
          <div className="space-y-4 text-center">
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mx-auto',
              lastResult?.verified ? (lastResult.message.includes('found') ? 'bg-primary-100' : 'bg-success-100') : 'bg-danger-100'
            )}>
              {lastResult?.verified ? (
                <CheckCircle className={cn("h-8 w-8", lastResult.message.includes('found') ? "text-primary-600" : "text-success-600")} />
              ) : (
                <AlertCircle className="h-8 w-8 text-danger-600" />
              )}
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {lastResult?.verified ? (lastResult.message.includes('found') ? 'Participant Found' : 'Access Granted') : 'Access Denied'}
              </p>
              <p className="text-gray-500 mt-1">{lastResult?.message}</p>
            </div>

            {lastResult?.verified && lastResult.participant && (
              <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2">
                <p className="font-medium text-gray-900">{lastResult.participant.name}</p>
                <p className="text-sm font-mono text-gray-600">{lastResult.participant.uniqueId}</p>
                {lastResult.participant.email && (
                  <p className="text-sm text-gray-500">{lastResult.participant.email}</p>
                )}
                <p className="text-xs text-gray-400">
                  {lastResult.participant.isReEntry ? 'Re-entry' : 'First entry'} • 
                  Scan #{lastResult.participant.scanCount}
                </p>
              </div>
            )}

            {lastResult?.verified && lastResult.message.includes('found') ? (
              <Button onClick={() => handleCheckIn(lastResult.participant!.uniqueId)} className="w-full bg-success-600 hover:bg-success-700 text-white" loading={isCheckingIn}>
                Confirm Check-in (Grant Access)
              </Button>
            ) : (
              <Button onClick={closeResult} className="w-full" variant={lastResult?.verified ? 'outline' : 'primary'}>
                Continue Scanning
              </Button>
            )}
          </div>
        </Modal>
      </div>
  );

  if (!isOpen && onClose) {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title="QR Code Scanner"
        size="lg"
        showCloseButton
      >
        {renderScannerContent()}
      </Modal>
    );
  }

  return renderScannerContent();
}