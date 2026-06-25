// ---------------------------------------------------------------------------
// Business dashboard — Operations: sites, tasks, QR clock-in, visitors
// ---------------------------------------------------------------------------

export interface Site {
  id: string;
  name: string;
  addressLine: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  active: boolean;
}
export interface SiteInput {
  name: string;
  addressLine?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
}

export type TaskStatus = 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETE';
export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigneeName: string | null;
  source: string | null;
  siteId: string | null;
  dueAt: string | null;
  status: TaskStatus;
  createdAt: string;
}
export interface TaskInput {
  title: string;
  description?: string;
  assigneeName?: string;
  source?: string;
  siteId?: string;
  dueAt?: string;
}

export interface SiteQrCode {
  id: string;
  siteId: string | null;
  siteName: string | null;
  leaderName: string | null;
  token: string;
  active: boolean;
  createdAt: string;
}
export interface QrInput {
  siteId?: string;
  siteName?: string;
  leaderName?: string;
}

export type VisitorKind = 'VISITOR' | 'CONTRACTOR' | 'DELIVERY' | 'STAFF' | 'OTHER';
export type VisitorStatus = 'ON_SITE' | 'CHECKED_OUT';
export interface Visitor {
  id: string;
  name: string;
  company: string | null;
  kind: VisitorKind;
  siteName: string | null;
  host: string | null;
  checkInAt: string;
  checkOutAt: string | null;
  status: VisitorStatus;
}
export interface VisitorInput {
  name: string;
  company?: string;
  kind?: VisitorKind;
  siteName?: string;
  host?: string;
}
