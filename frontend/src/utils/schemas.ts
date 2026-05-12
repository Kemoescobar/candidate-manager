import { z } from 'zod';

export const candidateSchema = z.object({
  firstName: z.string().min(2, 'Au moins 2 caractères').max(50, 'Maximum 50 caractères'),
  lastName: z.string().min(2, 'Au moins 2 caractères').max(50, 'Maximum 50 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional().or(z.literal('')),
  position: z.string().min(2, 'Au moins 2 caractères').max(100, 'Maximum 100 caractères'),
  experience: z.number({ invalid_type_error: 'Nombre requis' }).min(0).max(50),
  skills: z.array(z.string().min(1)).min(1, 'Au moins une compétence requise'),
  resumeUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export type CandidateFormData = z.infer<typeof candidateSchema>;

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Au moins 8 caractères'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
