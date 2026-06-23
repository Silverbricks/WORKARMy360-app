import { z } from 'zod';
import { APPLICATION_STAGES, type ApplicationStage } from '@workarmy/types';

// --- organisation ----------------------------------------------------------

const optionalText = (max = 200) => z.string().trim().max(max).optional();

export const OrgProfileUpdateSchema = z.object({
  legalName: optionalText(160),
  tradingName: optionalText(160),
  abn: z.string().trim().max(20).optional(),
  structure: optionalText(40),
  industry: optionalText(80),
  workforceSize: optionalText(40),
  about: optionalText(2000),
  website: optionalText(200),
  addressLine: optionalText(200),
  suburb: optionalText(80),
  state: optionalText(40),
  postcode: z.string().trim().max(8).optional(),
  region: optionalText(120),
});

export const ContactInputSchema = z.object({
  firstName: z.string().trim().min(1, 'Required').max(80),
  lastName: z.string().trim().min(1, 'Required').max(80),
  position: optionalText(80),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  phone: optionalText(40),
  roleTag: optionalText(40),
  isPrimary: z.boolean().optional(),
  isBilling: z.boolean().optional(),
  isEmergency: z.boolean().optional(),
  isSignatory: z.boolean().optional(),
});

// --- jobs ------------------------------------------------------------------

export const JobInputSchema = z.object({
  title: z.string().trim().min(2, 'Title is required').max(160),
  description: z.string().trim().max(5000).optional(),
  category: optionalText(80),
  employmentType: optionalText(40),
  location: optionalText(160),
  suburb: optionalText(80),
  state: optionalText(40),
  payMin: z.coerce.number().int().nonnegative().optional(),
  payMax: z.coerce.number().int().nonnegative().optional(),
  payUnit: optionalText(20),
  positions: z.coerce.number().int().positive().max(9999).optional(),
  startDate: z.string().datetime().optional().or(z.literal('')),
});

export const JobBrowseQuerySchema = z.object({
  q: optionalText(120),
  state: optionalText(40),
  category: optionalText(80),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(50).optional(),
});

// --- applications ----------------------------------------------------------

export const ApplyInputSchema = z.object({
  coverNote: z.string().trim().max(2000).optional(),
});

const stageEnum = z.enum(APPLICATION_STAGES as unknown as [ApplicationStage, ...ApplicationStage[]]);

export const StageChangeSchema = z.object({
  toStage: stageEnum,
  note: z.string().trim().max(1000).optional(),
});

// --- admin -----------------------------------------------------------------

export const ReviewSchema = z.object({
  note: z.string().trim().max(1000).optional(),
});

export type OrgProfileUpdateInput = z.infer<typeof OrgProfileUpdateSchema>;
export type ContactInputData = z.infer<typeof ContactInputSchema>;
export type JobInputData = z.infer<typeof JobInputSchema>;
export type JobBrowseQueryData = z.infer<typeof JobBrowseQuerySchema>;
export type ApplyInputData = z.infer<typeof ApplyInputSchema>;
export type StageChangeData = z.infer<typeof StageChangeSchema>;
export type ReviewData = z.infer<typeof ReviewSchema>;
