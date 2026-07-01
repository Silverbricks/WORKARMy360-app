// ---------------------------------------------------------------------------
// Form Builder — dynamic forms (inspections/incidents/checklists/reports) +
// their submissions. Part of the Platform Builder roadmap.
// ---------------------------------------------------------------------------

export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type FormFieldType = 'text' | 'textarea' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'currency';

export interface FormFieldDef {
  key: string;
  label: string;
  type: FormFieldType;
  options?: string[];
  required?: boolean;
}

export interface FormDefinition {
  id: string;
  name: string;
  description: string | null;
  category: string;
  fields: FormFieldDef[];
  status: FormStatus;
  version: number;
  submissionCount: number;
}

export interface FormInput {
  name: string;
  description?: string;
  category?: string;
  fields: FormFieldDef[];
}

export interface FormSubmissionView {
  id: string;
  formId: string;
  submitterName: string | null;
  contextLabel: string | null;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface FormSubmissionInput {
  data: Record<string, unknown>;
  contextLabel?: string;
}
