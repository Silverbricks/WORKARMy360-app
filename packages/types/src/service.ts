export type ServiceCategory = 'ACCOMMODATION' | 'TRANSPORT';
export type ServiceKind = 'HAVE' | 'NEED' | 'SHARE';

export interface ServiceListing {
  id: string;
  category: ServiceCategory;
  kind: ServiceKind;
  title: string;
  details: string | null;
  location: string | null;
  createdAt: string;
  mine: boolean;
  by: string;
}

export interface ServiceListingInput {
  category: ServiceCategory;
  kind: ServiceKind;
  title: string;
  details?: string;
  location?: string;
}
