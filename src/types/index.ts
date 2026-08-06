export interface Participant {
  _id: string;
  name: string;
  uniqueId: string;
  qrCodeData: string;
  qrCodeImage?: string;
  email?: string;
  phone?: string;
  metadata: Record<string, string>;
  isActive: boolean;
  scannedAt?: string;
  scannedBy?: string;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantListResponse {
  success: boolean;
  participants: Participant[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ParticipantResponse {
  success: boolean;
  participant: Participant;
  message?: string;
}

export interface VerifyResponse {
  success: boolean;
  verified: boolean;
  message: string;
  participant?: {
    name: string;
    uniqueId: string;
    email?: string;
    phone?: string;
    scannedAt: string;
    scanCount: number;
    isReEntry: boolean;
  };
}

export interface StatsResponse {
  success: boolean;
  stats: {
    total: number;
    active: number;
    scanned: number;
    todayScanned: number;
    notScanned: number;
  };
}

export interface BulkCreateResponse {
  success: boolean;
  message: string;
  results: {
    created: Array<{ name: string; uniqueId: string; email?: string }>;
    failed: Array<{ name: string; errors: string[] }>;
    skipped: Array<{ name: string; reason: string }>;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
}

export interface CreateParticipantData {
  name: string;
  email?: string;
  phone?: string;
  metadata?: Record<string, string>;
}

export interface UpdateParticipantData {
  name?: string;
  email?: string;
  phone?: string;
  metadata?: Record<string, string>;
  isActive?: boolean;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}