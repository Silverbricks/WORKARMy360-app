import type {
  ConversationThread,
  ConversationView,
  Notification,
  OkResponse,
  SendMessageInput,
  StartConversationInput,
  SupportTicket,
  SupportTicketInput,
  UserSettings,
  UserSettingsUpdate,
} from '@workarmy/types';
import type { HttpClient } from '../http';

export function createSupportClient(http: HttpClient) {
  return {
    // tickets
    tickets: () => http.request<SupportTicket[]>('/support/tickets'),
    createTicket: (body: SupportTicketInput) =>
      http.request<SupportTicket>('/support/tickets', { method: 'POST', body }),
    // notifications
    notifications: () => http.request<Notification[]>('/notifications'),
    markRead: (id: string) => http.request<OkResponse>(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => http.request<OkResponse>('/notifications/read-all', { method: 'POST' }),
    // settings
    settings: () => http.request<UserSettings>('/persons/me/settings'),
    updateSettings: (body: UserSettingsUpdate) =>
      http.request<UserSettings>('/persons/me/settings', { method: 'PUT', body }),
    // messages (worker side)
    conversations: () => http.request<ConversationView[]>('/messages'),
    thread: (id: string) => http.request<ConversationThread>(`/messages/${id}`),
    startConversation: (body: StartConversationInput) =>
      http.request<ConversationThread>('/messages/start', { method: 'POST', body }),
    sendMessage: (id: string, body: SendMessageInput) =>
      http.request<ConversationThread>(`/messages/${id}/send`, { method: 'POST', body }),
    // messages (provider side)
    orgConversations: () => http.request<ConversationView[]>('/org-messages'),
    orgThread: (id: string) => http.request<ConversationThread>(`/org-messages/${id}`),
    orgSendMessage: (id: string, body: SendMessageInput) =>
      http.request<ConversationThread>(`/org-messages/${id}/send`, { method: 'POST', body }),
  };
}

export type SupportClient = ReturnType<typeof createSupportClient>;
