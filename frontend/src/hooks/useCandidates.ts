import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesApi } from '../api/client';
import { CandidateFilters, CreateCandidateDto, UpdateCandidateDto } from '../types';
import { useAuth } from './useAuth';

export const useCandidates = (filters: CandidateFilters = {}) => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['candidates', filters],
    queryFn: () => candidatesApi.list(filters, token!),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCandidateDto) => candidatesApi.create(data, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['candidates'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCandidateDto }) =>
      candidatesApi.update(id, data, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['candidates'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => candidatesApi.delete(id, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['candidates'] }),
  });

  const validateMutation = useMutation({
    mutationFn: (id: string) => candidatesApi.validate(id, token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['candidates'] }),
  });

  return {
    candidates: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createCandidate: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateCandidate: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteCandidate: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    validateCandidate: validateMutation.mutateAsync,
    isValidating: validateMutation.isPending,
  };
};

export const useCandidate = (id: string) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['candidate', id],
    queryFn: () => candidatesApi.getById(id, token!),
    enabled: !!token && !!id,
  });
};

export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);

  const goToPage = useCallback((newPage: number) => setPage(newPage), []);
  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);

  return { page, limit, goToPage, nextPage, prevPage };
};
