import type {
  Feedback,
  FeedbackInput,
  Group,
  GroupInput,
  KnowledgeArticle,
  KnowledgeSummary,
  OkResponse,
} from '@workarmy/types';
import { toQueryString, type HttpClient } from '../http';

export function createCommunityClient(http: HttpClient) {
  return {
    knowledge: (category?: string) =>
      http.request<KnowledgeSummary[]>(`/knowledge${toQueryString({ category })}`),
    article: (slug: string) => http.request<KnowledgeArticle>(`/knowledge/${slug}`),
    groups: () => http.request<Group[]>('/groups'),
    myGroups: () => http.request<Group[]>('/groups/me'),
    createGroup: (body: GroupInput) => http.request<Group>('/groups', { method: 'POST', body }),
    joinGroup: (id: string) => http.request<OkResponse>(`/groups/${id}/join`, { method: 'POST' }),
    leaveGroup: (id: string) => http.request<OkResponse>(`/groups/${id}/leave`, { method: 'POST' }),
    submitFeedback: (body: FeedbackInput) =>
      http.request<Feedback>('/feedback', { method: 'POST', body }),
    myFeedback: () => http.request<Feedback[]>('/feedback/me'),
  };
}

export type CommunityClient = ReturnType<typeof createCommunityClient>;
