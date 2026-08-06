'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  ChevronUp,
  ChevronDown,
  Download,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  RotateCcw,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { QRCodeDisplay } from '@/components/ui/QRCodeDisplay';
import { participantsApi } from '@/lib/api';
import type { Participant, PaginationParams } from '@/types';
import { cn, formatDate, formatRelativeTime, getInitials, getStatusColor, truncate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ParticipantTableProps {
  onEdit: (participant: Participant) => void;
  onViewQR: (participant: Participant) => void;
}

export function ParticipantTable({ onEdit, onViewQR }: ParticipantTableProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'uniqueId'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isActiveFilter, setIsActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'delete' | 'reset-scan' | ''>('');
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [qrModalParticipant, setQrModalParticipant] = useState<Participant | null>(null);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const params: PaginationParams = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        search,
        sortBy,
        sortOrder,
        isActive: isActiveFilter === 'all' ? undefined : isActiveFilter === 'true',
      };
      const response = await participantsApi.getAll(params);
      setParticipants(response.participants);
      setPagination(response.pagination);
    } catch (error) {
      toast.error('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchParticipants();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, pagination.currentPage, pagination.itemsPerPage, sortBy, sortOrder, isActiveFilter]);

  const handleSort = (field: 'name' | 'createdAt' | 'uniqueId') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this participant?')) return;
    try {
      await participantsApi.delete(id);
      toast.success('Participant deleted');
      fetchParticipants();
    } catch (error) {
      toast.error('Failed to delete participant');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    
    let confirmMessage = '';
    if (bulkAction === 'delete') {
      confirmMessage = `Delete ${selectedIds.length} participants? This cannot be undone.`;
    } else if (bulkAction === 'reset-scan') {
      confirmMessage = `Reset scan status for ${selectedIds.length} participants?`;
    }
    
    if (!confirm(confirmMessage)) return;

    try {
      if (bulkAction === 'delete') {
        await Promise.all(selectedIds.map(id => participantsApi.delete(id)));
        toast.success(`${selectedIds.length} participants deleted`);
      } else if (bulkAction === 'reset-scan') {
        await Promise.all(selectedIds.map(id => participantsApi.resetScan(id)));
        toast.success(`Scan status reset for ${selectedIds.length} participants`);
      }
      setSelectedIds([]);
      setBulkAction('');
      fetchParticipants();
    } catch (error) {
      toast.error('Bulk action failed');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) 
      ? prev.filter(x => x !== id) 
      : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === participants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(participants.map(p => p._id));
    }
  };

  const handleExport = async () => {
    try {
      const blob = await participantsApi.export();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `participants-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleRegenerateQR = async (id: string) => {
    try {
      const response = await participantsApi.regenerateQR(id);
      toast.success('QR code regenerated');
      fetchParticipants();
    } catch (error) {
      toast.error('Failed to regenerate QR code');
    }
  };

  const handleResetScan = async (id: string) => {
    try {
      await participantsApi.resetScan(id);
      toast.success('Scan status reset');
      fetchParticipants();
    } catch (error) {
      toast.error('Failed to reset scan status');
    }
  };

  const SortIcon = ({ field }: { field: 'name' | 'createdAt' | 'uniqueId' }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-primary-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-primary-600" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(prev => ({ ...prev, currentPage: 1 }));
            }}
            placeholder="Search by name, email, ID..."
            className="input pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={isActiveFilter}
            onChange={(e) => {
              setIsActiveFilter(e.target.value as 'all' | 'true' | 'false');
              setPagination(prev => ({ ...prev, currentPage: 1 }));
            }}
            className="input w-auto"
          >
            <option value="all">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <Button variant="outline" onClick={handleExport} size="sm">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>

          <Button variant="outline" onClick={fetchParticipants} size="sm" loading={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-sm font-medium text-primary-800">
            {selectedIds.length} selected
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value as 'delete' | 'reset-scan' | '')}
              className="input w-auto"
            >
              <option value="">Select action...</option>
              <option value="reset-scan">Reset Scan Status</option>
              <option value="delete">Delete</option>
            </select>
            <Button
              variant={bulkAction === 'delete' ? 'danger' : 'primary'}
              onClick={() => setShowBulkConfirm(true)}
              disabled={!bulkAction}
              size="sm"
            >
              Apply
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="table" role="grid">
          <thead>
            <tr>
              <th className="w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.length === participants.length && participants.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  aria-label="Select all"
                />
              </th>
              <th className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">
                  Name
                  <SortIcon field="name" />
                </div>
              </th>
              <th className="cursor-pointer select-none hidden md:table-cell" onClick={() => handleSort('uniqueId')}>
                <div className="flex items-center gap-1">
                  Unique ID
                  <SortIcon field="uniqueId" />
                </div>
              </th>
              <th className="hidden lg:table-cell">Email</th>
              <th className="hidden lg:table-cell">Phone</th>
              <th>Status</th>
              <th className="cursor-pointer select-none" onClick={() => handleSort('createdAt')}>
                <div className="flex items-center gap-1">
                  Created
                  <SortIcon field="createdAt" />
                </div>
              </th>
              <th className="w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <div className="flex items-center justify-center gap-3 text-gray-500">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary-600" />
                    Loading participants...
                  </div>
                </td>
              </tr>
            ) : participants.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-500">
                  No participants found
                </td>
              </tr>
            ) : (
              participants.map((participant) => (
                <tr key={participant._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(participant._id)}
                      onChange={() => toggleSelect(participant._id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="font-medium text-gray-900">{participant.name}</td>
                  <td className="hidden md:table-cell font-mono text-sm text-gray-600">
                    {truncate(participant.uniqueId, 20)}
                  </td>
                  <td className="hidden lg:table-cell text-gray-600">
                    {participant.email || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="hidden lg:table-cell text-gray-600">
                    {participant.phone || <span className="text-gray-300">—</span>}
                  </td>
                  <td>
                    <span className={cn(
                      'badge',
                      getStatusColor(participant.isActive, participant.scannedAt).bg,
                      getStatusColor(participant.isActive, participant.scannedAt).text
                    )}>
                      {getStatusColor(participant.isActive, participant.scannedAt).label}
                    </span>
                    {participant.scannedAt && (
                      <span className="ml-1 text-xs text-gray-400">
                        ({formatRelativeTime(participant.scannedAt)})
                      </span>
                    )}
                  </td>
                  <td className="text-sm text-gray-500">{formatDate(participant.createdAt)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewQR(participant)}
                        aria-label="View QR code"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(participant)}
                        aria-label="Edit participant"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenerateQR(participant._id)}
                        aria-label="Regenerate QR"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      {participant.scannedAt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetScan(participant._id)}
                          aria-label="Reset scan"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(participant._id)}
                        aria-label="Delete participant"
                        className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
            {pagination.totalItems} participants
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </Button>
            <span className="px-3 text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Confirm Modal */}
      <Modal
        isOpen={showBulkConfirm}
        onClose={() => setShowBulkConfirm(false)}
        title={bulkAction === 'delete' ? 'Confirm Delete' : 'Confirm Reset'}
        description={
          bulkAction === 'delete'
            ? `This will permanently delete ${selectedIds.length} participants. This action cannot be undone.`
            : `This will reset scan status for ${selectedIds.length} participants.`
        }
        size="sm"
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowBulkConfirm(false)}>
            Cancel
          </Button>
          <Button
            variant={bulkAction === 'delete' ? 'danger' : 'primary'}
            onClick={handleBulkAction}
          >
            {bulkAction === 'delete' ? 'Delete' : 'Reset'}
          </Button>
        </div>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        isOpen={!!qrModalParticipant}
        onClose={() => setQrModalParticipant(null)}
        title="QR Code"
        size="md"
      >
        {qrModalParticipant && (
          <QRCodeDisplay
            qrCodeImage={qrModalParticipant.qrCodeImage}
            uniqueId={qrModalParticipant.uniqueId}
            name={qrModalParticipant.name}
            size={256}
          />
        )}
      </Modal>
    </div>
  );
}