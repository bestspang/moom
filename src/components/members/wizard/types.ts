import { z } from 'zod';
import {
  personProfileSchema,
  personContactSchema,
  personAddressSchema,
  emergencyContactSchema,
  medicalInfoSchema,
  consentInfoSchema,
} from '@/lib/personSchemas';

export const createMemberWizardSchema = (t: (key: string) => string) =>
  personProfileSchema(t)
    .merge(z.object({
      // Member-specific: lastName + registerLocationId required
      lastName: z.string().min(1, t('validation.lastNameRequired')).max(100),
      registerLocationId: z.string().min(1, t('validation.required')),
    }))
    .merge(personContactSchema(t))
    .merge(personAddressSchema())
    .merge(emergencyContactSchema())
    .merge(medicalInfoSchema())
    .merge(consentInfoSchema())
    .merge(z.object({
      // Step 6 - Other
      source: z.string().optional().or(z.literal('')),
      packageInterestId: z.string().optional().or(z.literal('')),
      notes: z.string().max(2000).optional().or(z.literal('')),
    }))
    .refine(
      (data) => (data.phone && data.phone.trim().length > 0) || (data.email && data.email.trim().length > 0),
      { message: t('memberWizard.phoneOrEmailRequired'), path: ['phone'] }
    );

export type MemberWizardFormData = z.infer<ReturnType<typeof createMemberWizardSchema>>;

// Fields per step for per-step validation
export const STEP_FIELDS: Record<number, (keyof MemberWizardFormData)[]> = {
  1: ['firstName', 'lastName', 'nickname', 'dateOfBirth', 'gender', 'registerLocationId'],
  2: ['phone', 'email'],
  3: ['address'],
  4: ['emergencyContactName', 'emergencyContactPhone', 'emergencyRelationship'],
  5: ['hasMedicalConditions', 'medicalNotes', 'allowPhysicalContact', 'physicalContactNotes'],
  6: ['source', 'packageInterestId', 'notes'],
};

export const TOTAL_STEPS = 6;
