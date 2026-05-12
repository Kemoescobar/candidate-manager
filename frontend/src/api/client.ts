import axios, { AxiosInstance } from 'axios';
import {
  ApiResponse,
  AuthResponse,
  Candidate,
  CandidateFilters,
  CreateCandidateDto,
  LoginCredentials,
  UpdateCandidateDto,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const createApiClient = (token?: string): AxiosInstance => {
  const client = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  client.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const client = createApiClient();
    const res = await client.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return res.data;
  },
  register: async (data: { email: string; password: string; name: string }): Promise<ApiResponse<AuthResponse>> => {
    const client = createApiClient();
    const res = await client.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return res.data;
  },
};

export const candidatesApi = {
  list: async (filters: CandidateFilters, token: string): Promise<ApiResponse<Candidate[]>> => {
    const client = createApiClient(token);
    const res = await client.get<ApiResponse<Candidate[]>>('/candidates', { params: filters });
    return res.data;
  },

  getById: async (id: string, token: string): Promise<ApiResponse<Candidate>> => {
    const client = createApiClient(token);
    const res = await client.get<ApiResponse<Candidate>>(`/candidates/${id}`);
    return res.data;
  },

  create: async (data: CreateCandidateDto, token: string): Promise<ApiResponse<Candidate>> => {
    const client = createApiClient(token);
    const res = await client.post<ApiResponse<Candidate>>('/candidates', data);
    return res.data;
  },

  update: async (id: string, data: UpdateCandidateDto, token: string): Promise<ApiResponse<Candidate>> => {
    const client = createApiClient(token);
    const res = await client.put<ApiResponse<Candidate>>(`/candidates/${id}`, data);
    return res.data;
  },

  delete: async (id: string, token: string): Promise<ApiResponse<null>> => {
    const client = createApiClient(token);
    const res = await client.delete<ApiResponse<null>>(`/candidates/${id}`);
    return res.data;
  },

  validate: async (id: string, token: string): Promise<ApiResponse<Candidate>> => {
    const client = createApiClient(token);
    const res = await client.post<ApiResponse<Candidate>>(`/candidates/${id}/validate`);
    return res.data;
  },
};
