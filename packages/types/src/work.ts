export type ShiftStatus = 'OPEN' | 'FILLED' | 'COMPLETED' | 'CANCELLED';
export type AssignmentStatus =
  | 'ASSIGNED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'SWAP_REQUESTED';
export type TimesheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface Shift {
  id: string;
  title: string;
  jobId: string | null;
  location: string | null;
  suburb: string | null;
  state: string | null;
  startAt: string;
  endAt: string;
  breakMinutes: number;
  payRate: number | null;
  payUnit: string | null;
  positions: number;
  notes: string | null;
  status: ShiftStatus;
}

export interface ShiftInput {
  title: string;
  jobId?: string;
  location?: string;
  suburb?: string;
  state?: string;
  startAt: string;
  endAt: string;
  breakMinutes?: number;
  payRate?: number;
  payUnit?: string;
  positions?: number;
  notes?: string;
}

export interface AttendanceView {
  clockInAt: string | null;
  clockOutAt: string | null;
}

export interface AssignmentView {
  id: string;
  status: AssignmentStatus;
  person: { waId: string; firstName: string | null; lastName: string | null };
  attendance: AttendanceView | null;
}

/** Provider view: a shift with its assignments. */
export interface ShiftWithAssignments extends Shift {
  assignments: AssignmentView[];
}

/** Worker view: a shift the person is assigned to. */
export interface WorkerShift {
  assignmentId: string;
  status: AssignmentStatus;
  shift: Shift;
  org: { name: string };
  attendance: AttendanceView | null;
}

export interface AssignInput {
  waId: string;
}

export interface ClockInput {
  lat?: number;
  lng?: number;
}

export interface TimesheetEntryView {
  id: string;
  date: string;
  hours: number;
  note: string | null;
}

export interface TimesheetView {
  id: string;
  weekStart: string;
  status: TimesheetStatus;
  totalHours: number;
  createdAt: string;
  person?: { waId: string; name: string };
  org?: { name: string };
  entries: TimesheetEntryView[];
}

export interface Payslip {
  id: string;
  periodStart: string;
  periodEnd: string;
  hours: number;
  grossPay: number;
  tax: number;
  superannuation: number;
  netPay: number;
  documentId: string | null;
  createdAt: string;
  person?: { waId: string; name: string };
  org?: { name: string };
}

export interface PayslipInput {
  personWaId: string;
  periodStart: string;
  periodEnd: string;
  hours?: number;
  grossPay?: number;
  tax?: number;
  superannuation?: number;
  netPay?: number;
}

/** A current/previous employer derived from shift assignments + hired applications. */
export interface EmployerSummary {
  orgId: string;
  name: string;
  accountType: string;
  current: boolean;
  shiftsCount: number;
}
