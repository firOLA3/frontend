'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Camera, CheckCircle, AlertCircle, RotateCcw, Settings } from 'lucide-react';
import { Scanner } from '@/components/Scanner';
import { participantsApi } from '@/lib/api';
import type { VerifyResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ScannerPage() {
  const [scanHistory, setScanHistory] = useState<VerifyResponse[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [lastScan, setLastScan] = useState<VerifyResponse | null>(null);
  const [scannedBy, setScannedBy] = useState('');

  const handleScan = (result: VerifyResponse) => {
    setLastScan(result);
    if (result.verified) {
      setScanHistory(prev => [result, ...prev.slice(0, 49)]); // Keep last 50
    }
  };

  const clearHistory = () => {
    if (confirm('Clear scan history?')) {
      setScanHistory([]);
      setLastScan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">QR Code Scanner</h1>
                <p className="text-sm text-gray-500">Scan QR codes to verify participants</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Admin</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">History</span>
                {scanHistory.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full">
                    {scanHistory.length}
                  </span>
                )}
              </Button>
            </div>
          </div>
          
          {/* Scanner ID Input */}
          <div className="px-4 pb-4 sm:px-0 sm:pb-0 border-b border-gray-200 mb-4">
            <div className="flex items-center gap-2 max-w-md">
              <label htmlFor="scanner-id" className="text-sm font-medium text-gray-700 whitespace-nowrap">Scanner ID:</label>
              <input
                id="scanner-id"
                type="text"
                value={scannedBy}
                onChange={(e) => setScannedBy(e.target.value)}
                placeholder="Enter scanner name/ID"
                className="input"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Scanner */}
        <Scanner 
          onScan={handleScan}
          isOpen={true}
          scannedBy={scannedBy}
        />

        {/* Last Scan Result */}
        {lastScan && (
          <div className={cn(
            'mt-6 p-4 rounded-xl border animate-slide-in',
            lastScan.verified ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200'
          )}>
            <div className="flex items-start gap-4">
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                lastScan.verified ? 'bg-success-100' : 'bg-danger-100'
              )}>
                {lastScan.verified ? (
                  <CheckCircle className="h-6 w-6 text-success-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-danger-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('font-semibold', lastScan.verified ? 'text-success-800' : 'text-danger-800')}>
                  {lastScan.verified ? 'Access Granted' : 'Access Denied'}
                </p>
                <p className="text-sm text-gray-600 mt-1">{lastScan.message}</p>
                
                {lastScan.verified && lastScan.participant && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{lastScan.participant.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Unique ID</p>
                      <p className="font-mono text-gray-900">{lastScan.participant.uniqueId}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className="font-medium text-gray-900">
                        {lastScan.participant.isReEntry ? 'Re-entry' : 'First Entry'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Scan Count</p>
                      <p className="font-medium text-gray-900">#{lastScan.participant.scanCount}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scan History */}
        {showHistory && (
          <div className="mt-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Scan History</h2>
              {scanHistory.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearHistory} className="text-danger-600 hover:text-danger-700">
                  Clear History
                </Button>
              )}
            </div>
            
            {scanHistory.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No scans yet</p>
                <p className="text-sm text-gray-400 mt-1">Scan a QR code to see history</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Scan #</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanHistory.map((scan, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500">
                            {new Date().toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {scan.participant?.name || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-600">
                            {scan.participant?.uniqueId || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'badge',
                              scan.verified ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'
                            )}>
                              {scan.verified ? 'Granted' : 'Denied'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            #{scan.participant?.scanCount || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            Instructions
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Camera Scanning</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Allow camera permissions when prompted</li>
                <li>Position QR code within the frame</li>
                <li>Hold steady until scan completes</li>
                <li>Use camera switcher for different cameras</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Manual Entry</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Type or paste the Unique ID</li>
                <li>Press Enter or click Verify</li>
                <li>IDs are case-insensitive</li>
                <li>Format: EVT-XXXXXX-XXXXXX</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}