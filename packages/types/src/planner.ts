// ---------------------------------------------------------------------------
// Workforce Platform Builder — config substrate + generic roster engine.
// Industries are DATA: the runtime renders from resolved config, never branches.
// ---------------------------------------------------------------------------

export type RosterSource = 'COMPANY' | 'CONTRACTOR' | 'AGENCY' | 'SOLE_TRADER' | 'NEARBY';
export type StaffingRequirementStatus = 'DRAFT' | 'OPEN' | 'PUBLISHED' | 'FILLED' | 'CLOSED';
export type RosterScope = 'ORG' | 'CLIENT' | 'SITE' | 'DEPARTMENT' | 'TEAM';
export type ModuleLicense = 'DISABLED' | 'TRIAL' | 'SUBSCRIPTION' | 'ENABLED' | 'ENTERPRISE';
/** Reuses the platform AssignmentStatus values. */
export type RequirementAssignmentStatus =
  | 'ASSIGNED'
  | 'CONFIRMED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'SWAP_REQUESTED';

// --- Module Marketplace + Industry templates (catalog data) ----------------

export interface ModuleCatalogEntry {
  key: string;
  label: string;
  group: string;
  description: string;
  dependsOn?: string[];
}

export interface IndustryCategoryDef {
  key: string;
  label: string;
  color: string;
}
export interface IndustryGateDef {
  key: string;
  label: string;
  credentialType: string;
  block: boolean;
}
export interface IndustryShiftTemplate {
  name: string;
  category: string;
  startTime: string;
  endTime: string;
}
export interface IndustryTemplate {
  key: string;
  label: string;
  emoji?: string;
  planningMode: string;
  terminology: Record<string, string>;
  modules: string[];
  categories: IndustryCategoryDef[];
  gates: IndustryGateDef[];
  shiftTemplates: IndustryShiftTemplate[];
}
/** Lightweight summary for the template picker. */
export interface IndustryTemplateSummary {
  key: string;
  label: string;
  emoji?: string;
  moduleCount: number;
}

// --- Resolved config (what the runtime + FE read) --------------------------

export interface ConfigModule {
  key: string;
  enabled: boolean;
  license: ModuleLicense;
}
export interface ConfigCategory {
  key: string;
  label: string;
  color: string;
  kind: string;
}
export interface ConfigGate {
  key: string;
  label: string;
  credentialType: string;
  block: boolean;
}
export interface ConfigField {
  key: string;
  label: string;
  type: string;
  options: string[] | null;
  target: string;
  required: boolean;
  order: number;
}
export interface ResolvedConfig {
  scope: RosterScope;
  templateKey: string | null;
  planningMode: string;
  weekStartsMonday: boolean;
  /** canonical term → company label (e.g. { location: "Block" }). */
  terminology: Record<string, string>;
  modules: ConfigModule[];
  categories: ConfigCategory[];
  gates: ConfigGate[];
  fields: ConfigField[];
}

// --- Roster templates ------------------------------------------------------

export interface RosterTemplateView {
  id: string;
  name: string;
  category: string;
  role: string | null;
  startTime: string | null;
  endTime: string | null;
  siteId: string | null;
  requiredCount: number;
  payRate: number | null;
  payUnit: string | null;
  templateKey: string | null;
}

// --- Requirements + assignments --------------------------------------------

export interface RequirementAssignmentView {
  id: string;
  personId: string;
  waId: string;
  name: string;
  source: RosterSource;
  status: RequirementAssignmentStatus;
}
export interface StaffingRequirementView {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  category: string;
  siteId: string | null;
  locationText: string | null;
  client: string | null;
  payRate: number | null;
  payUnit: string | null;
  requiredCount: number;
  status: StaffingRequirementStatus;
  openMarketplace: boolean;
  notes: string | null;
  fields: Record<string, unknown> | null;
  publishedAt: string | null;
  assigned: number;
  vacant: number;
  assignments: RequirementAssignmentView[];
}

// --- Conflicts + candidates (smarts) ---------------------------------------

export type ConflictKind = 'DOUBLE_BOOKED' | 'ON_LEAVE' | 'CREDENTIAL_EXPIRED' | 'OVER_HOURS';
export interface Conflict {
  kind: ConflictKind;
  severity: 'WARN' | 'BLOCK';
  message: string;
}
export interface PlannerCandidate {
  personId: string;
  waId: string;
  name: string;
  source: RosterSource;
  skills: string | null;
  suburb: string | null;
  state: string | null;
  payRate: number | null;
  score: number;
  scoreReasons: string[];
  conflicts: Conflict[];
  assigned: boolean;
}

// --- Grid + summary --------------------------------------------------------

export interface RosterGridCell {
  requirementId: string;
  assignmentId: string;
  role: string;
  category: string;
  startTime: string;
  endTime: string;
  locationText: string | null;
  status: StaffingRequirementStatus;
  conflicts: ConflictKind[];
}
export interface RosterGridRow {
  personId: string | null;
  waId: string | null;
  name: string;
  source: RosterSource | null;
  teamId: string | null;
  onCall: boolean;
  urgentAvailable: boolean;
  availabilityNote: string | null;
  hours: number;
  shifts: number;
  estPay: number;
  cellsByDate: Record<string, RosterGridCell[]>;
}
export interface RosterOpenCell {
  requirementId: string;
  role: string;
  category: string;
  startTime: string;
  endTime: string;
  locationText: string | null;
  vacant: number;
}
export interface RosterLeaveCell {
  name: string;
  type: string;
}
export interface PlannerSummary {
  required: number;
  assigned: number;
  vacant: number;
  leave: number;
  overtime: number;
  available: number;
  hours: number;
  estPayroll: number;
  employees: number;
  openShifts: number;
  publicHolidays: number;
}

export interface WeatherDay {
  date: string;
  emoji: string;
  tempMax: number | null;
  tempMin: number | null;
  summary: string;
}

export interface RosterWeek {
  weekStart: string;
  days: string[];
  rows: RosterGridRow[];
  openByDate: Record<string, RosterOpenCell[]>;
  leaveByDate: Record<string, RosterLeaveCell[]>;
  holidaysByDate: Record<string, string>;
  weatherByDate?: Record<string, WeatherDay>;
  summary: PlannerSummary;
}

// --- worker-facing (job-seeker app) ---------------------------------------

/** A shift the logged-in worker is assigned to (their own roster). */
export interface MyShiftView {
  assignmentId: string;
  requirementId: string;
  status: RequirementAssignmentStatus;
  orgName: string;
  role: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  locationText: string | null;
  client: string | null;
}

/** An open (cascaded) shift a worker can claim, with the offering company. */
export interface MarketplaceShift {
  requirementId: string;
  orgName: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  category: string;
  locationText: string | null;
  client: string | null;
  vacant: number;
}

/** A staff card for the Staff view — all active workers + their week rollup. */
export interface RosterStaffCard {
  personId: string;
  waId: string;
  name: string;
  source: RosterSource;
  role: string | null;
  skills: string | null;
  visa: string | null;
  hours: number;
  shifts: number;
  estPay: number;
  availability: string;
}

export interface OpenShift {
  requirementId: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  category: string;
  locationText: string | null;
  client: string | null;
  vacant: number;
}

// --- Input shapes (request bodies; mirror the Zod schemas) ------------------

export interface ApplyTemplateInput {
  templateKey: string;
}
export interface ConfigGeneralInput {
  planningMode?: 'demand' | 'staff';
  weekStartsMonday?: boolean;
  name?: string;
}
export interface ModuleToggleInput {
  key: string;
  enabled?: boolean;
  license?: ModuleLicense;
}
export interface ConfigTermInput {
  term: string;
  label: string;
}
export interface ConfigCategoryInput {
  key: string;
  label: string;
  color: string;
  kind?: 'SHIFT' | 'STATUS';
}
export interface ConfigGateInput {
  key: string;
  label: string;
  credentialType: string;
  block?: boolean;
}
export interface ConfigFieldInput {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'currency';
  options?: string[];
  target?: 'requirement' | 'worker' | 'shift';
  required?: boolean;
  order?: number;
}
export interface RosterTemplateInput {
  name: string;
  category?: string;
  role?: string;
  startTime?: string;
  endTime?: string;
  siteId?: string;
  requiredCount?: number;
  payRate?: number;
  payUnit?: string;
}
export interface StaffingRequirementInput {
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  category?: string;
  siteId?: string;
  locationText?: string;
  client?: string;
  payRate?: number;
  payUnit?: string;
  requiredCount?: number;
  notes?: string;
  openMarketplace?: boolean;
  fields?: Record<string, unknown>;
}
export type StaffingRequirementUpdate = Partial<StaffingRequirementInput>;
export interface PlannerAssignInput {
  waId?: string;
  personId?: string;
  source?: RosterSource;
}
export interface PlannerRespondInput {
  response: 'ACCEPTED' | 'DECLINED' | 'CONFIRMED';
}
export interface PlannerCopyInput {
  fromDate: string;
  toDate: string;
}
export interface PlannerRepeatInput {
  pattern: 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY';
  count: number;
}
export interface PlannerFromTemplateInput {
  templateId: string;
  date: string;
}
export interface PlannerPublishRangeInput {
  from: string;
  to: string;
}
export interface PlannerCascadeInput {
  channels?: Array<'ON_CALL' | 'CONTRACTORS' | 'AGENCIES' | 'NETWORK'>;
}
