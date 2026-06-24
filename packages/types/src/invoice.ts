export type InvoiceStatus = 'Sent' | 'Paid';
export type InvoiceLineKind = 'hourly' | 'piece';

export interface InvoiceLineItem {
  id: string;
  kind: InvoiceLineKind;
  description: string;
  qty: number;
  rateCents: number;
  lineTotalCents: number;
}

export interface InvoiceLineItemInput {
  kind: InvoiceLineKind;
  description: string;
  qty: number;
  rateCents: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientAbn: string | null;
  date: string; // ISO YYYY-MM-DD
  gst: boolean;
  notes: string | null;
  status: InvoiceStatus;
  subtotalCents: number;
  gstCents: number;
  totalCents: number;
  lineItems: InvoiceLineItem[];
  createdAt: string;
}

export interface InvoiceInput {
  /** Optional — the server generates one when omitted. */
  number?: string;
  clientName: string;
  clientAbn?: string;
  date: string;
  gst?: boolean;
  notes?: string;
  lineItems: InvoiceLineItemInput[];
}
