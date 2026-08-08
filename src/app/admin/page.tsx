'use client';

import { useState } from 'react';
import { Plus, Download, Upload, RefreshCw, Camera } from 'lucide-react';
import Link from 'next/link';
import { StatsCards } from '@/components/admin/StatsCards';
import { ParticipantTable } from '@/components/admin/ParticipantTable';
import { ParticipantForm } from '@/components/admin/ParticipantForm';
import { CSVUpload } from '@/components/admin/CSVUpload';
import { Button } from '@/components/ui/Button';
import { participantsApi } from '@/lib/api';
import type { Participant } from '@/types';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [viewQRParticipant, setViewQRParticipant] = useState<Participant | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddParticipant = () => {
    setEditingParticipant(null);
    setShowAddForm(true);
  };

  const handleEditParticipant = (participant: Participant) => {
    setEditingParticipant(participant);
    setShowAddForm(true);
  };

  const handleViewQR = (participant: Participant) => {
    setViewQRParticipant(participant);
  };

  const handleSuccess = () => {
    handleRefresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 sm:h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Barcode Auth Admin</h1>
                <p className="text-sm text-gray-500">Manage participants and QR codes</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/scanner">
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4" />
                  <span className="hidden sm:inline">Scanner</span>
                </Button>
              </Link>
              <Button variant="outline" onClick={handleRefresh} size="sm">
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button variant="outline" onClick={() => setShowCSVUpload(true)} size="sm">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Import CSV</span>
              </Button>
              <Button onClick={handleAddParticipant} size="sm">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Participant</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <StatsCards onRefresh={handleRefresh} key={refreshTrigger} />

        {/* Participants Table */}
        <div className="mt-8">
          <ParticipantTable
            onEdit={handleEditParticipant}
            onViewQR={handleViewQR}
            key={refreshTrigger}
          />
        </div>
      </main>

      {/* Add/Edit Participant Modal */}
      <ParticipantForm
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setEditingParticipant(null);
        }}
        onSuccess={handleSuccess}
        initialData={editingParticipant}
        mode={editingParticipant ? 'edit' : 'create'}
      />

      {/* CSV Upload Modal */}
      <CSVUpload
        isOpen={showCSVUpload}
        onClose={() => setShowCSVUpload(false)}
        onSuccess={handleSuccess}
      />

      {/* QR Code View Modal */}
      {viewQRParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
             onClick={() => setViewQRParticipant(null)}
             role="dialog" aria-modal="true" aria-labelledby="qr-modal-title">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 id="qr-modal-title" className="text-lg font-semibold text-gray-900">QR Code</h2>
              <button onClick={() => setViewQRParticipant(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                {viewQRParticipant.qrCodeImage ? (
                  <img src={viewQRParticipant.qrCodeImage} alt={`QR for ${viewQRParticipant.name}`} width={256} height={256} />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-gray-400">
                    <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="text-center w-full">
                <p className="font-mono text-sm font-semibold text-gray-900 tracking-wider">{viewQRParticipant.uniqueId}</p>
                <p className="text-xs text-gray-500 truncate">{viewQRParticipant.name}</p>
              </div>
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1" onClick={(e) => {
                  e.stopPropagation();
                  if (viewQRParticipant.qrCodeImage) {
                    const link = document.createElement('a');
                    link.href = viewQRParticipant.qrCodeImage;
                    link.download = `${viewQRParticipant.name.replace(/\s+/g, '-')}-${viewQRParticipant.uniqueId}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}>
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button variant="outline" className="flex-1" onClick={(e) => {
                  e.stopPropagation();
                  if (viewQRParticipant.qrCodeImage) {
                    navigator.clipboard.writeText(viewQRParticipant.uniqueId);
                    toast.success('Unique ID copied!');
                  }
                }}>
                  Copy ID
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}