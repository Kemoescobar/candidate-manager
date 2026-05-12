import Joi from 'joi';

export const createCandidateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).trim().required().messages({
    'string.min': 'Le prénom doit contenir au moins 2 caractères',
    'string.max': 'Le prénom ne peut pas dépasser 50 caractères',
    'any.required': 'Le prénom est obligatoire',
  }),
  lastName: Joi.string().min(2).max(50).trim().required().messages({
    'string.min': 'Le nom doit contenir au moins 2 caractères',
    'string.max': 'Le nom ne peut pas dépasser 50 caractères',
    'any.required': 'Le nom est obligatoire',
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Veuillez fournir une adresse email valide',
    'any.required': "L'email est obligatoire",
  }),
  phone: Joi.string()
    .pattern(/^[+]?[\d\s\-().]{7,20}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Veuillez fournir un numéro de téléphone valide',
    }),
  position: Joi.string().min(2).max(100).trim().required().messages({
    'string.min': 'Le poste doit contenir au moins 2 caractères',
    'string.max': 'Le poste ne peut pas dépasser 100 caractères',
    'any.required': 'Le poste est obligatoire',
  }),
  experience: Joi.number().min(0).max(50).required().messages({
    'number.min': "L'expérience ne peut pas être négative",
    'number.max': "L'expérience ne peut pas dépasser 50 ans",
    'any.required': "L'expérience est obligatoire",
  }),
  skills: Joi.array().items(Joi.string().trim().min(1)).min(1).required().messages({
    'array.min': 'Au moins une compétence est requise',
    'any.required': 'Les compétences sont obligatoires',
  }),
  resumeUrl: Joi.string().uri().optional().allow('').messages({
    'string.uri': "L'URL du CV doit être une URL valide",
  }),
  notes: Joi.string().max(1000).optional().allow('').messages({
    'string.max': 'Les notes ne peuvent pas dépasser 1000 caractères',
  }),
});

export const updateCandidateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).trim().optional(),
  lastName: Joi.string().min(2).max(50).trim().optional(),
  email: Joi.string().email().lowercase().trim().optional(),
  phone: Joi.string()
    .pattern(/^[+]?[\d\s\-().]{7,20}$/)
    .optional()
    .allow(''),
  position: Joi.string().min(2).max(100).trim().optional(),
  experience: Joi.number().min(0).max(50).optional(),
  skills: Joi.array().items(Joi.string().trim().min(1)).min(1).optional(),
  resumeUrl: Joi.string().uri().optional().allow(''),
  notes: Joi.string().max(1000).optional().allow(''),
}).min(1).messages({
  'object.min': 'Au moins un champ est requis pour la mise à jour',
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email invalide',
    'any.required': 'Email requis',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
    'any.required': 'Mot de passe requis',
  }),
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base':
        'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
    }),
  name: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('admin', 'recruiter').optional(),
});

export const listCandidatesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('pending', 'validated', 'rejected').optional(),
  position: Joi.string().optional(),
  search: Joi.string().optional(),
  sortBy: Joi.string().valid('createdAt', 'lastName', 'firstName', 'position').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});
