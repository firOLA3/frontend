import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  Participant,
  ParticipantListResponse,
  ParticipantResponse,
  VerifyResponse,
  StatsResponse,
  BulkCreateResponse,
  PaginationParams,
  CreateParticipantData,
  UpdateParticipantData,
  ApiError,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor for auth (if needed later)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token here if needed
    // const token = getToken();
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Participants API
export const participantsApi = {
  // Get all participants with pagination
  getAll: async (params: PaginationParams = {}): Promise<ParticipantListResponse> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const response = await api.get<ParticipantListResponse>(`/participants?${searchParams}`);
    return response.data;
  },

  // Get single participant
  getById: async (id: string): Promise<ParticipantResponse> => {
    const response = await api.get<ParticipantResponse>(`/participants/${id}`);
    return response.data;
  },

  // Create participant
  create: async (data: CreateParticipantData): Promise<ParticipantResponse> => {
    const response = await api.post<ParticipantResponse>('/participants', data);
    return response.data;
  },

  // Update participant
  update: async (id: string, data: UpdateParticipantData): Promise<ParticipantResponse> => {
    const response = await api.put<ParticipantResponse>(`/participants/${id}`, data);
    return response.data;
  },

  // Delete participant
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/participants/${id}`);
    return response.data;
  },

  // Bulk create from CSV
  bulkCreate: async (file: File): Promise<BulkCreateResponse> => {
    const formData = new FormData();
    formData.append('csvFile', file);
    const response = await api.post<BulkCreateResponse>('/participants/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Verify participant (scanner)
  verify: async (identifier: string, scannedBy?: string): Promise<VerifyResponse> => {
    const response = await api.get<VerifyResponse>(`/participants/verify/${encodeURIComponent(identifier)}`, {
      params: { scannedBy },
    });
    return response.data;
  },

  // Check in participant (grant access)
  checkIn: async (identifier: string, scannedBy?: string): Promise<VerifyResponse> => {
    const response = await api.post<VerifyResponse>(`/participants/check-in/${encodeURIComponent(identifier)}`, {
      scannedBy,
    });
    return response.data;
  },

  // Get stats
  getStats: async (): Promise<StatsResponse> => {
    const response = await api.get<StatsResponse>('/participants/stats');
    return response.data;
  },

  // Download CSV template
  downloadTemplate: async (): Promise<Blob> => {
    const response = await api.get('/participants/template', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Export participants to CSV
  export: async (): Promise<Blob> => {
    const response = await api.get('/participants/export', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Regenerate QR code
  regenerateQR: async (id: string): Promise<ParticipantResponse> => {
    const response = await api.post<ParticipantResponse>(`/participants/${id}/regenerate-qr`);
    return response.data;
  },

  // Reset scan status
  resetScan: async (id: string): Promise<ParticipantResponse> => {
    const response = await api.post<ParticipantResponse>(`/participants/${id}/reset-scan`);
    return response.data;
  },

  // Bulk reset scan status
  bulkResetScan: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/participants/bulk-reset-scan');
    return response.data;
  },
};

// Health check
export const healthCheck = async (): Promise<{ success: boolean; message: string }> => {
  const response = await api.get('/health');
  return response.data;
};

export default api;