export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export interface Job {
  id: string;
  orgId: string;
  title: string;
  description: string | null;
  status: JobStatus;
  category: string | null;
  employmentType: string | null;
  location: string | null;
  suburb: string | null;
  state: string | null;
  payMin: number | null;
  payMax: number | null;
  payUnit: string | null;
  positions: number;
  startDate: string | null;
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Public-facing job (browse/detail) — includes the hiring org's display info. */
export interface JobListing extends Job {
  org: { name: string; accountType: string };
  applicantCount?: number;
  applied?: boolean;
  saved?: boolean;
}

export interface JobInput {
  title: string;
  description?: string;
  category?: string;
  employmentType?: string;
  location?: string;
  suburb?: string;
  state?: string;
  payMin?: number;
  payMax?: number;
  payUnit?: string;
  positions?: number;
  startDate?: string;
}

export interface JobBrowseQuery {
  q?: string;
  state?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
