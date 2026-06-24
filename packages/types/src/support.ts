export type TicketStatus = 'OPEN' | 'RESOLVED';

export interface SupportTicket {
  id: string;
  category: string;
  subject: string;
  body: string;
  status: TicketStatus;
  response: string | null;
  createdAt: string;
}

export interface SupportTicketInput {
  category: string;
  subject: string;
  body: string;
}

export interface Notification {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface UserSettings {
  notifyJobs: boolean;
  notifyMessages: boolean;
  notifyCompliance: boolean;
  profilePublic: boolean;
  language: string;
}

export interface UserSettingsUpdate {
  notifyJobs?: boolean;
  notifyMessages?: boolean;
  notifyCompliance?: boolean;
  profilePublic?: boolean;
  language?: string;
}

export interface MessageView {
  id: string;
  body: string;
  mine: boolean;
  createdAt: string;
}

export interface ConversationView {
  id: string;
  counterparty: { name: string; waId: string };
  lastMessage: string | null;
  updatedAt: string;
  unread: number;
}

export interface ConversationThread {
  id: string;
  counterparty: { name: string };
  messages: MessageView[];
}

export interface StartConversationInput {
  orgWaId: string;
  body: string;
}

export interface SendMessageInput {
  body: string;
}
