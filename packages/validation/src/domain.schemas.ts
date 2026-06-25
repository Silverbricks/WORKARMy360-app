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

// --- person (Job Seeker profile) -------------------------------------------

const HIRE_STATUSES = ['AVAILABLE_NOW', 'AVAILABLE_SOON', 'OPEN', 'NOT_LOOKING'] as const;

export const PersonProfileUpdateSchema = z.object({
  // identity (live on the person row)
  firstName: optionalText(80),
  lastName: optionalText(80),
  mobile: optionalText(40),
  // personal
  photoUrl: optionalText(500),
  dateOfBirth: optionalText(10),
  gender: optionalText(40),
  nationality: optionalText(80),
  addressLine: optionalText(200),
  suburb: optionalText(80),
  state: optionalText(40),
  postcode: z.string().trim().max(8).optional(),
  emergencyName: optionalText(120),
  emergencyPhone: optionalText(40),
  // professional
  headline: optionalText(160),
  about: optionalText(2000),
  skills: optionalText(600),
  industries: optionalText(400),
  languages: optionalText(200),
  // availability
  availability: optionalText(40),
  availableDays: optionalText(120),
  availableHours: optionalText(120),
  // hire-me status
  hireStatus: z.enum(HIRE_STATUSES).optional().or(z.literal('')),
});

export const WorkExperienceInputSchema = z.object({
  employer: z.string().trim().min(1, 'Required').max(160),
  position: optionalText(120),
  employmentType: optionalText(40),
  location: optionalText(160),
  startDate: optionalText(10),
  endDate: optionalText(10),
  current: z.boolean().optional(),
  summary: optionalText(1000),
});

export const PersonPreferencesUpdateSchema = z.object({
  seekerCategory: optionalText(80),
  userTypes: optionalText(200), // csv
  preferredLocations: optionalText(200), // csv; service enforces max 3
  preferredIndustries: optionalText(400),
  preferredJobTypes: optionalText(400),
  preferredPayMin: z.coerce.number().int().nonnegative().optional(),
  willingToRelocate: z.boolean().optional(),
});

// --- credentials & verification --------------------------------------------

export const CredentialInputSchema = z.object({
  type: z.string().trim().min(1, 'Required').max(60),
  identifier: optionalText(120),
  issuer: optionalText(120),
  expiresAt: optionalText(10),
  documentId: optionalText(40),
});

export const VerificationRequestSchema = z.object({
  credentialId: z.string().trim().min(1, 'Required'),
});

// --- resume & photo --------------------------------------------------------

export const ResumeUpdateSchema = z.object({
  headline: optionalText(160),
  summary: z.string().trim().max(4000).optional(),
  coverLetters: z
    .array(z.object({ title: z.string().trim().max(120), body: z.string().trim().max(5000) }))
    .max(10)
    .optional(),
  documentId: z.string().trim().max(40).nullable().optional(),
});

export const ResumeShareSchema = z.object({ isPublic: z.boolean() });

export const PhotoUpdateSchema = z.object({ documentId: z.string().trim().min(1).max(40) });

export const HireStatusUpdateSchema = z.object({
  hireStatus: z.enum(['AVAILABLE_NOW', 'AVAILABLE_SOON', 'OPEN', 'NOT_LOOKING']),
});

export const WorkLogInputSchema = z.object({
  employer: z.string().trim().min(1, 'Employer is required').max(160),
  date: z.string().trim().min(1).max(10),
  hours: z.coerce.number().positive().max(24),
  note: optionalText(500),
});

// --- get-job-faster availability card --------------------------------------

export const AvailabilityCardUpdateSchema = z.object({
  qualification: optionalText(200),
  suburb: optionalText(80),
  state: optionalText(40),
  availability: optionalText(40),
  workType: z.enum(['hourly', 'weekly', 'contract', 'any']).optional().or(z.literal('')),
  availableFrom: z.string().trim().max(10).optional().or(z.literal('')),
  urgentShifts: z.boolean().optional(),
  willingToRelocate: z.boolean().optional(),
  preferredIndustries: optionalText(400),
  contactPreference: z.enum(['in_app', 'phone', 'email']).optional().or(z.literal('')),
  published: z.boolean().optional(),
});

// --- work readiness (Gate 3) + tax -----------------------------------------

export const WorkReadinessUpdateSchema = z.object({
  engagement: z.enum(['employee', 'contract']).optional(),
  tfn: z.string().trim().regex(/^\d{8,9}$/, 'TFN must be 8–9 digits').optional().or(z.literal('')),
  abn: z.string().trim().regex(/^\d{11}$/, 'ABN must be 11 digits').optional().or(z.literal('')),
  hasSuper: z.boolean().optional(),
  superFund: optionalText(120),
  superMember: optionalText(60),
  bankBsb: z.string().trim().regex(/^\d{6}$/, 'BSB must be 6 digits').optional().or(z.literal('')),
  bankAccount: z.string().trim().regex(/^\d{5,10}$/, 'Account must be 5–10 digits').optional().or(z.literal('')),
  noCashAck: z.boolean().optional(),
  bankLater: z.boolean().optional(),
});

export const TaxLodgementInputSchema = z.object({
  kind: z.enum(['personal', 'abn']),
  financialYear: z.string().trim().regex(/^\d{4}-\d{2}$/, 'Use a year like 2024-25'),
  note: optionalText(1000),
});

export const TaxShareInputSchema = z.object({
  employer: z.string().trim().min(1, 'Employer is required').max(160),
  passwordProtected: z.boolean().optional(),
});

// --- invoices --------------------------------------------------------------

export const InvoiceLineItemSchema = z.object({
  kind: z.enum(['hourly', 'piece']),
  description: z.string().trim().min(1, 'Required').max(200),
  qty: z.coerce.number().int().positive().max(100000),
  rateCents: z.coerce.number().int().nonnegative().max(100000000),
});

export const InvoiceInputSchema = z.object({
  number: optionalText(40),
  clientName: z.string().trim().min(1, 'Client is required').max(160),
  clientAbn: z.string().trim().regex(/^\d{11}$/, 'ABN must be 11 digits').optional().or(z.literal('')),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  gst: z.boolean().optional(),
  notes: optionalText(2000),
  lineItems: z.array(InvoiceLineItemSchema).min(1, 'Add at least one line item').max(50),
});

// --- work & earnings -------------------------------------------------------

export const ShiftInputSchema = z.object({
  title: z.string().trim().min(2, 'Title is required').max(160),
  jobId: optionalText(40),
  location: optionalText(160),
  suburb: optionalText(80),
  state: optionalText(40),
  startAt: z.string().trim().min(1, 'Start time is required'),
  endAt: z.string().trim().min(1, 'End time is required'),
  breakMinutes: z.coerce.number().int().nonnegative().max(600).optional(),
  payRate: z.coerce.number().int().nonnegative().optional(),
  payUnit: optionalText(20),
  positions: z.coerce.number().int().positive().max(999).optional(),
  notes: optionalText(2000),
});

export const AssignInputSchema = z.object({
  waId: z.string().trim().min(1, 'Worker WA ID is required'),
});

export const ClockInputSchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});

export const SwapRequestInputSchema = z.object({
  note: optionalText(500),
});

export const PayslipInputSchema = z.object({
  personWaId: z.string().trim().min(1, 'Worker WA ID is required'),
  periodStart: z.string().trim().min(1).max(10),
  periodEnd: z.string().trim().min(1).max(10),
  hours: z.coerce.number().nonnegative().optional(),
  grossPay: z.coerce.number().int().nonnegative().optional(),
  tax: z.coerce.number().int().nonnegative().optional(),
  superannuation: z.coerce.number().int().nonnegative().optional(),
  netPay: z.coerce.number().int().nonnegative().optional(),
});

export const BecomeProviderSchema = z.object({
  accountType: z.enum(['EMPLOYER', 'FARM', 'CONTRACTOR', 'LABOUR_HIRE', 'RECRUITMENT_AGENCY']),
  companyName: z.string().trim().min(2, 'Organisation name is required').max(160),
});

// --- community -------------------------------------------------------------

export const GroupInputSchema = z.object({
  kind: z.enum(['POOL', 'TEAM']),
  name: z.string().trim().min(2, 'Name is required').max(120),
  description: optionalText(500),
});

export const FeedbackInputSchema = z.object({
  kind: z.string().trim().min(1).max(40),
  message: z.string().trim().min(2, 'Message is required').max(2000),
});

// --- support, messages, settings -------------------------------------------

export const SupportTicketInputSchema = z.object({
  category: z.string().trim().min(1).max(40),
  subject: z.string().trim().min(2, 'Subject is required').max(160),
  body: z.string().trim().min(2, 'Please describe the issue').max(4000),
});

export const UserSettingsUpdateSchema = z.object({
  notifyJobs: z.boolean().optional(),
  notifyMessages: z.boolean().optional(),
  notifyCompliance: z.boolean().optional(),
  profilePublic: z.boolean().optional(),
  language: optionalText(20),
});

export const StartConversationSchema = z.object({
  orgWaId: z.string().trim().min(1, 'Organisation WA ID is required'),
  body: z.string().trim().min(1, 'Message is required').max(4000),
});

export const SendMessageSchema = z.object({
  body: z.string().trim().min(1, 'Message is required').max(4000),
});

export const ServiceListingInputSchema = z.object({
  category: z.enum(['ACCOMMODATION', 'TRANSPORT']),
  kind: z.enum(['HAVE', 'NEED', 'SHARE']),
  title: z.string().trim().min(2, 'Title is required').max(160),
  details: optionalText(1000),
  location: optionalText(160),
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
  urgent: z.coerce.boolean().optional(),
  shareToggles: z
    .object({
      inApp: z.boolean(),
      social: z.boolean(),
      onSite: z.boolean(),
      topPriority: z.boolean(),
    })
    .partial()
    .optional(),
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
export type PersonProfileUpdateInput = z.infer<typeof PersonProfileUpdateSchema>;
export type WorkExperienceInputData = z.infer<typeof WorkExperienceInputSchema>;
export type PersonPreferencesUpdateInput = z.infer<typeof PersonPreferencesUpdateSchema>;
export type CredentialInputData = z.infer<typeof CredentialInputSchema>;
export type VerificationRequestData = z.infer<typeof VerificationRequestSchema>;
export type ResumeUpdateData = z.infer<typeof ResumeUpdateSchema>;
export type ResumeShareData = z.infer<typeof ResumeShareSchema>;
export type PhotoUpdateData = z.infer<typeof PhotoUpdateSchema>;
export type HireStatusUpdateData = z.infer<typeof HireStatusUpdateSchema>;
export type WorkLogInputData = z.infer<typeof WorkLogInputSchema>;
export type AvailabilityCardUpdateData = z.infer<typeof AvailabilityCardUpdateSchema>;
export type WorkReadinessUpdateData = z.infer<typeof WorkReadinessUpdateSchema>;
export type TaxLodgementInputData = z.infer<typeof TaxLodgementInputSchema>;
export type TaxShareInputData = z.infer<typeof TaxShareInputSchema>;
export type InvoiceLineItemData = z.infer<typeof InvoiceLineItemSchema>;
export type InvoiceInputData = z.infer<typeof InvoiceInputSchema>;
export type ShiftInputData = z.infer<typeof ShiftInputSchema>;
export type AssignInputData = z.infer<typeof AssignInputSchema>;
export type ClockInputData = z.infer<typeof ClockInputSchema>;
export type SwapRequestInputData = z.infer<typeof SwapRequestInputSchema>;
export type PayslipInputData = z.infer<typeof PayslipInputSchema>;
export type BecomeProviderData = z.infer<typeof BecomeProviderSchema>;
export type GroupInputData = z.infer<typeof GroupInputSchema>;
export type FeedbackInputData = z.infer<typeof FeedbackInputSchema>;
export type SupportTicketInputData = z.infer<typeof SupportTicketInputSchema>;
export type UserSettingsUpdateData = z.infer<typeof UserSettingsUpdateSchema>;
export type StartConversationData = z.infer<typeof StartConversationSchema>;
export type SendMessageData = z.infer<typeof SendMessageSchema>;
export type ServiceListingInputData = z.infer<typeof ServiceListingInputSchema>;
export type JobInputData = z.infer<typeof JobInputSchema>;
export type JobBrowseQueryData = z.infer<typeof JobBrowseQuerySchema>;
export type ApplyInputData = z.infer<typeof ApplyInputSchema>;
export type StageChangeData = z.infer<typeof StageChangeSchema>;
export type ReviewData = z.infer<typeof ReviewSchema>;

// --- staff: org workers, teams, worker directory, rosters ------------------
export const OrgWorkerInputSchema = z.object({
  waId: z.string().trim().min(3, 'Worker ID is required').max(20),
  staffType: optionalText(60),
  onCall: z.coerce.boolean().optional(),
  urgentAvailable: z.coerce.boolean().optional(),
  availabilityNote: optionalText(300),
});
export const OrgWorkerUpdateSchema = z.object({
  staffType: optionalText(60),
  onCall: z.coerce.boolean().optional(),
  urgentAvailable: z.coerce.boolean().optional(),
  availabilityNote: optionalText(300),
  teamId: z.string().uuid().nullish(),
  active: z.coerce.boolean().optional(),
});
export const TeamInputSchema = z.object({
  name: z.string().trim().min(1, 'Team name is required').max(120),
  description: optionalText(500),
  supervisorMemberId: z.string().uuid().optional(),
});
export const TeamMemberInputSchema = z.object({
  waId: z.string().trim().min(3, 'Worker ID is required').max(20),
  roleInTeam: optionalText(60),
});
export const WorkerDirectoryQuerySchema = z.object({
  q: optionalText(120),
  state: optionalText(40),
  workType: optionalText(40),
  urgent: z.coerce.boolean().optional(),
});
export const WorkerInviteSchema = z.object({ message: optionalText(500) });
export const RosterInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160),
  date: z.string().trim().min(1, 'Date is required'),
  start: z.string().trim().min(1, 'Start time is required'),
  end: z.string().trim().min(1, 'End time is required'),
  teamId: z.string().uuid().optional(),
  waIds: z.array(z.string().trim().min(3).max(20)).max(100).optional(),
});
export const RosterAssignSchema = z.object({ waId: z.string().trim().min(3).max(20) });
export const RosterRespondSchema = z.object({
  response: z.enum(['ACCEPTED', 'DECLINED', 'CONFIRMED']),
});

export type OrgWorkerInputData = z.infer<typeof OrgWorkerInputSchema>;
export type OrgWorkerUpdateData = z.infer<typeof OrgWorkerUpdateSchema>;
export type TeamInputData = z.infer<typeof TeamInputSchema>;
export type TeamMemberInputData = z.infer<typeof TeamMemberInputSchema>;
export type WorkerDirectoryQueryData = z.infer<typeof WorkerDirectoryQuerySchema>;
export type WorkerInviteData = z.infer<typeof WorkerInviteSchema>;
export type RosterInputData = z.infer<typeof RosterInputSchema>;
export type RosterAssignData = z.infer<typeof RosterAssignSchema>;
export type RosterRespondData = z.infer<typeof RosterRespondSchema>;

// --- staffing: staff requests + quick dispatch -----------------------------
export const StaffRequestInputSchema = z.object({
  type: z.enum(['URGENT_SHIFT', 'BULK_CREW', 'STANDARD']).optional(),
  urgency: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional(),
  roleTitle: z.string().trim().min(1, 'Role / title is required').max(160),
  industry: optionalText(80),
  description: optionalText(2000),
  employmentType: optionalText(40),
  site: optionalText(160),
  siteAddress: optionalText(200),
  suburb: optionalText(80),
  state: optionalText(40),
  startDate: optionalText(20),
  shiftType: optionalText(40),
  startTime: optionalText(10),
  finishTime: optionalText(10),
  headcountTotal: z.coerce.number().int().positive().max(9999).optional(),
  headcountMale: z.coerce.number().int().nonnegative().max(9999).optional(),
  headcountFemale: z.coerce.number().int().nonnegative().max(9999).optional(),
  headcountAny: z.coerce.number().int().nonnegative().max(9999).optional(),
  days: optionalText(120),
  skills: optionalText(500),
  licences: optionalText(500),
  experience: optionalText(60),
  english: optionalText(40),
  ppe: optionalText(500),
  ppeSupplied: z.coerce.boolean().optional(),
  reportToName: optionalText(120),
  reportToRole: optionalText(60),
  reportToMobile: optionalText(40),
  reportToLocation: optionalText(80),
  siteNotes: optionalText(1000),
  payRate: optionalText(40),
  payBasis: optionalText(40),
  award: optionalText(120),
  transport: z.coerce.boolean().optional(),
  accommodation: z.coerce.boolean().optional(),
  meals: z.coerce.boolean().optional(),
  additionalNotes: optionalText(2000),
  partnerLabels: z.array(z.string().trim().max(160)).max(50).optional(),
});
export const DispatchInputSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(1000),
  roleNeeded: optionalText(160),
  headcount: z.coerce.number().int().positive().max(9999).optional(),
  whenAt: optionalText(40),
  channels: z.array(z.enum(['ON_CALL', 'CONTRACTORS', 'AGENCIES', 'NETWORK'])).min(1, 'Pick a channel'),
});
export type StaffRequestInputData = z.infer<typeof StaffRequestInputSchema>;
export type DispatchInputData = z.infer<typeof DispatchInputSchema>;

// --- HR: leave, reviews, onboarding, warnings ------------------------------
export const LeaveInputSchema = z.object({
  personName: z.string().trim().min(1, 'Staff name is required').max(120),
  type: z.enum(['ANNUAL', 'SICK', 'UNPAID', 'OTHER']).optional(),
  startDate: z.string().trim().min(1, 'Start date is required'),
  endDate: z.string().trim().min(1, 'End date is required'),
  reason: optionalText(500),
});
export const LeaveDecisionSchema = z.object({ status: z.enum(['APPROVED', 'DECLINED', 'CANCELLED']) });
export const PerformanceReviewInputSchema = z.object({
  personName: z.string().trim().min(1, 'Staff name is required').max(120),
  rating: z.coerce.number().int().min(1).max(5),
  comments: optionalText(1000),
  period: optionalText(60),
});
export const OnboardingInputSchema = z.object({
  personName: z.string().trim().min(1, 'Person name is required').max(120),
  kind: z.enum(['ONBOARDING', 'OFFBOARDING']).optional(),
  step: optionalText(120),
});
export const OnboardingStatusSchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE']),
});
export const WarningInputSchema = z.object({
  personName: z.string().trim().min(1, 'Staff name is required').max(120),
  kind: z.enum(['WARNING', 'INCIDENT']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  summary: z.string().trim().min(1, 'Summary is required').max(300),
  details: optionalText(1000),
  occurredAt: optionalText(20),
});
export type LeaveInputData = z.infer<typeof LeaveInputSchema>;
export type LeaveDecisionData = z.infer<typeof LeaveDecisionSchema>;
export type PerformanceReviewInputData = z.infer<typeof PerformanceReviewInputSchema>;
export type OnboardingInputData = z.infer<typeof OnboardingInputSchema>;
export type OnboardingStatusData = z.infer<typeof OnboardingStatusSchema>;
export type WarningInputData = z.infer<typeof WarningInputSchema>;

// --- Operations: sites, tasks, QR, visitors --------------------------------
export const SiteInputSchema = z.object({
  name: z.string().trim().min(1, 'Site name is required').max(160),
  addressLine: optionalText(200),
  suburb: optionalText(80),
  state: optionalText(40),
  postcode: optionalText(10),
});
export const TaskInputSchema = z.object({
  title: z.string().trim().min(1, 'Task is required').max(200),
  description: optionalText(1000),
  assigneeName: optionalText(120),
  source: optionalText(40),
  siteId: z.string().uuid().optional(),
  dueAt: optionalText(20),
});
export const TaskStatusSchema = z.object({
  status: z.enum(['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETE']),
});
export const QrInputSchema = z.object({
  siteId: z.string().uuid().optional(),
  siteName: optionalText(160),
  leaderName: optionalText(120),
});
export const VisitorInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  company: optionalText(120),
  kind: z.enum(['VISITOR', 'CONTRACTOR', 'DELIVERY', 'STAFF', 'OTHER']).optional(),
  siteName: optionalText(160),
  host: optionalText(120),
});
export type SiteInputData = z.infer<typeof SiteInputSchema>;
export type TaskInputData = z.infer<typeof TaskInputSchema>;
export type TaskStatusData = z.infer<typeof TaskStatusSchema>;
export type QrInputData = z.infer<typeof QrInputSchema>;
export type VisitorInputData = z.infer<typeof VisitorInputSchema>;
