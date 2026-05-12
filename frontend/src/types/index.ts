export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  experience: number;
  skills: string[];
  status: 'pending' | 'validated' | 'rejected' | 'deleted';
  resumeUrl?: string;
  notes?: string;
  validatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidateDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  experience: number;
  skills: string[];
  resumeUrl?: string;
  notes?: string;
}

export type UpdateCandidateDto = Partial<CreateCandidateDto>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: { field: string; message: string }[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface CandidateFilters {
  page?: number;
  limit?: number;
  status?: string;
  position?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
