export interface WorkLog {
  id: string;
  employer: string;
  date: string; // ISO YYYY-MM-DD
  hours: number;
  note: string | null;
  createdAt: string;
}

export interface WorkLogInput {
  employer: string;
  date: string;
  hours: number;
  note?: string;
}
