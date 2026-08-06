'use client';

import { useState } from 'react';
import { Upload, FileText, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { participantsApi } from '@/lib/api';
import type { BulkCreateResponse } from '@/types';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CSVUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CSVUpload({ isOpen, onClose, onSuccess }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<BulkCreateResponse | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        toast.error('Please upload a CSV file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        toast.error('Please select a CSV file');
        e.target.value = '';
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await participantsApi.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'participants-template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsUploading(true);
    try {
      const response = await participantsApi.bulkCreate(file);
      setResult(response);
      
      if (response.success) {
        toast.success(response.message);
        onSuccess();
        // Auto-close after showing results for a moment
        setTimeout(() => onClose(), 3000);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setResult(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Bulk Import Participants"
      size="lg"
    >
      {!result ? (
        <div className="space-y-6">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              'relative border-2 border-dashed rounded-xl p-8 text-center transition-colors',
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400'
            )}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-lg font-medium text-gray-900">Drop CSV file here or click to browse</p>
              <p className="text-sm text-gray-500 mt-1">Maximum file size: 5MB</p>
            </label>
          </div>

          {file && (
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                Remove
              </Button>
            </div>
          )}

          {/* Template Download */}
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500 mb-3">Need a template?</p>
            <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
              <Download className="h-4 w-4" />
              Download CSV Template
            </Button>
            <p className="text-xs text-gray-400 text-center mt-2">
              Template includes: name, email, phone, department, role, notes
            </p>
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            loading={isUploading}
            className="w-full"
            size="lg"
          >
            <Loader2 className="h-4 w-4" />
            {isUploading ? 'Importing...' : 'Import Participants'}
          </Button>
        </div>
      ) : (
        // Results View
        <div className="space-y-4">
          <div className={cn(
            'p-4 rounded-lg flex items-center gap-3',
            result.results.created.length > 0 ? 'bg-success-50' : 'bg-gray-50'
          )}>
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', 
              result.results.created.length > 0 ? 'bg-success-100' : 'bg-gray-100'
            )}>
              {result.results.created.length > 0 ? (
                <CheckCircle className="h-5 w-5 text-success-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-gray-500" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{result.message}</p>
              <p className="text-sm text-gray-500">
                {result.results.created.length} created • 
                {result.results.failed.length} failed • 
                {result.results.skipped.length} skipped
              </p>
            </div>
          </div>

          {result.results.created.length > 0 && (
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                <span className="font-medium text-gray-900">Created ({result.results.created.length})</span>
                <svg className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {result.results.created.map((item, i) => (
                  <div key={i} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-success-100 text-success-600 flex items-center justify-center text-xs font-medium">{i + 1}</span>
                    <span className="font-mono">{item.uniqueId}</span>
                    <span className="text-gray-400">{item.name}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {result.results.failed.length > 0 && (
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                <span className="font-medium text-danger-600">Failed ({result.results.failed.length})</span>
                <svg className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {result.results.failed.map((item, i) => (
                  <div key={i} className="text-sm text-danger-600 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-danger-100 text-danger-600 flex items-center justify-center text-xs font-medium">{i + 1}</span>
                    <span>{item.name}</span>
                    <span className="text-gray-400">- {item.errors.join(', ')}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {result.results.skipped.length > 0 && (
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                <span className="font-medium text-warning-600">Skipped ({result.results.skipped.length})</span>
                <svg className="h-5 w-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {result.results.skipped.map((item, i) => (
                  <div key={i} className="text-sm text-warning-600 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-warning-100 text-warning-600 flex items-center justify-center text-xs font-medium">{i + 1}</span>
                    <span>{item.name}</span>
                    <span className="text-gray-400">- {item.reason}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={() => { resetForm(); onClose(); }} className="flex-1">
              Close
            </Button>
            <Button variant="outline" onClick={resetForm} className="flex-1">
              Import Another File
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}