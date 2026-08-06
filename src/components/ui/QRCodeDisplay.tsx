'use client';

import { Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface QRCodeDisplayProps {
  qrCodeImage?: string;
  uniqueId: string;
  name: string;
  size?: number;
  showDownload?: boolean;
  showCopy?: boolean;
  className?: string;
}

export function QRCodeDisplay({
  qrCodeImage,
  uniqueId,
  name,
  size = 200,
  showDownload = true,
  showCopy = true,
  className,
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    if (!qrCodeImage) return;
    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `${name.replace(/\s+/g, '-')}-${uniqueId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    if (!qrCodeImage) return;
    try {
      // Convert data URL to blob and copy to clipboard
      const response = await fetch(qrCodeImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy QR code:', error);
      // Fallback: copy the unique ID
      await navigator.clipboard.writeText(uniqueId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        {qrCodeImage ? (
          <img
            src={qrCodeImage}
            alt={`QR Code for ${name} - ${uniqueId}`}
            width={size}
            height={size}
            className="mx-auto"
          />
        ) : (
          <div className={cn('flex items-center justify-center text-gray-400', `w-${size} h-${size}`)}>
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className="font-mono text-sm font-semibold text-gray-900 tracking-wider">{uniqueId}</p>
        <p className="text-xs text-gray-500 truncate max-w-xs">{name}</p>
      </div>

      {(showDownload || showCopy) && (
        <div className="flex items-center gap-2">
          {showDownload && qrCodeImage && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              aria-label="Download QR code"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          )}
          {showCopy && qrCodeImage && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              aria-label={copied ? 'Copied!' : 'Copy QR code'}
            >
              {copied ? <Check className="h-4 w-4 text-success-500" /> : <Copy className="h-4 w-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}