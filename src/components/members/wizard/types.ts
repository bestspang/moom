import { z } from 'zod';

export const createMemberWizardSchema = (t: (key: string) => string) =>
  z.object({
    // Step 1 - Profile
    firstName: z.string().min(1, t('validation.firstNameRequired')).max(100),
    lastName: z.string().min(1, t('validation.lastNameRequired')).max(100),
    nickname: z.string().max(50).optional().or(z.literal('')),
    dateOfBirth: z.string().optional().or(z.literal('')),
    gender: z.enum(['male', 'female', 'other']).optional(),
    registerLocationId: z.string().min(1, t('validation.required')),

    // Step 2 - Contact
    phone: z.string().max(20).optional().or(z.literal('')),
    email: z.string().email(t('validation.invalidEmail')).optional().or(z.literal('')),

    // Step 3 - Address
    address: z.string().max(500).optional().or(z.literal('')),

    // Step 4 - Emergency
    emergencyContactName: z.string().max(100).optional().or(z.literal('')),
    emergencyContactPhone: z.string().max(20).optional().or(z.literal('')),
    emergencyRelationship: z.string().max(100).optional().or(z.literal('')),

    // Step 5 - Medical & Consent
    hasMedicalConditions: z.boolean().optional(),
    medicalNotes: z.string().max(2000).optional().or(z.literal('')),
    allowPhysicalContact: z.boolean().optional(),
    physicalContactNotes: z.string().max(2000).optional().or(z.literal('')),

    // Step 6 - Other
    source: z.string().optional().or(z.literal('')),
    packageInterestId: z.string().optional().or(z.literal('')),
    notes: z.string().max(2000).optional().or(z.literal('')),
  }).refine(
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
