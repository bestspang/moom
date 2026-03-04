import { z } from 'zod';

/** Shared person profile fields (lead + member) */
export const personProfileSchema = (t: (key: string) => string) =>
  z.object({
    firstName: z.string().min(1, t('validation.firstNameRequired')).max(100),
    lastName: z.string().max(100).optional().or(z.literal('')),
    nickname: z.string().max(50).optional().or(z.literal('')),
    dateOfBirth: z.string().optional().or(z.literal('')),
    gender: z.enum(['male', 'female', 'other']).optional(),
  });

/** Shared contact fields */
export const personContactSchema = (t: (key: string) => string) =>
  z.object({
    phone: z.string().max(20).optional().or(z.literal('')),
    email: z.string().email(t('validation.invalidEmail')).optional().or(z.literal('')),
  });

/** Shared address field */
export const personAddressSchema = () =>
  z.object({
    address: z.string().max(500).optional().or(z.literal('')),
  });

/** Emergency contact fields */
export const emergencyContactSchema = () =>
  z.object({
    emergencyContactName: z.string().max(100).optional().or(z.literal('')),
    emergencyContactPhone: z.string().max(20).optional().or(z.literal('')),
    emergencyRelationship: z.string().max(100).optional().or(z.literal('')),
  });

/** Medical info fields */
export const medicalInfoSchema = () =>
  z.object({
    hasMedicalConditions: z.boolean().optional(),
    medicalNotes: z.string().max(2000).optional().or(z.literal('')),
  });

/** Consent info fields */
export const consentInfoSchema = () =>
  z.object({
    allowPhysicalContact: z.boolean().optional(),
    physicalContactNotes: z.string().max(2000).optional().or(z.literal('')),
  });
