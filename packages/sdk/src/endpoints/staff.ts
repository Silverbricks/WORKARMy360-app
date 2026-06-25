import type {
  OkResponse,
  OrgWorker,
  OrgWorkerInput,
  OrgWorkerUpdate,
  RosterAssignInput,
  RosterInput,
  RosterRespondInput,
  RosterShift,
  Team,
  TeamInput,
  TeamMemberInput,
  WhosTurningUpDay,
  WorkerDirectoryItem,
  WorkerDirectoryQuery,
  WorkerInviteInput,
} from '@workarmy/types';
import type { HttpClient } from '../http';

function qs(params: object): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export function createStaffClient(http: HttpClient) {
  return {
    workers: {
      list: (q?: { onCall?: boolean; urgent?: boolean; staffType?: string }) =>
        http.request<OrgWorker[]>(`/org-workers${qs(q ?? {})}`),
      add: (body: OrgWorkerInput) => http.request<OrgWorker>('/org-workers', { method: 'POST', body }),
      update: (id: string, body: OrgWorkerUpdate) =>
        http.request<OrgWorker>(`/org-workers/${id}`, { method: 'PATCH', body }),
      remove: (id: string) => http.request<OkResponse>(`/org-workers/${id}`, { method: 'DELETE' }),
    },
    teams: {
      list: () => http.request<Team[]>('/teams'),
      create: (body: TeamInput) => http.request<Team>('/teams', { method: 'POST', body }),
      remove: (id: string) => http.request<OkResponse>(`/teams/${id}`, { method: 'DELETE' }),
      addMember: (id: string, body: TeamMemberInput) =>
        http.request<Team>(`/teams/${id}/members`, { method: 'POST', body }),
      removeMember: (id: string, memberId: string) =>
        http.request<OkResponse>(`/teams/${id}/members/${memberId}`, { method: 'DELETE' }),
    },
    directory: {
      browse: (q?: WorkerDirectoryQuery) =>
        http.request<WorkerDirectoryItem[]>(`/worker-directory${qs(q ?? {})}`),
      invite: (waId: string, body: WorkerInviteInput) =>
        http.request<OkResponse>(`/worker-directory/${waId}/invite`, { method: 'POST', body }),
    },
    rosters: {
      list: () => http.request<RosterShift[]>('/rosters'),
      create: (body: RosterInput) => http.request<RosterShift>('/rosters', { method: 'POST', body }),
      assign: (id: string, body: RosterAssignInput) =>
        http.request<RosterShift>(`/rosters/${id}/assign`, { method: 'POST', body }),
      respond: (assignmentId: string, body: RosterRespondInput) =>
        http.request<RosterShift>(`/rosters/assignments/${assignmentId}/respond`, {
          method: 'POST',
          body,
        }),
      publish: (id: string) => http.request<RosterShift>(`/rosters/${id}/publish`, { method: 'POST' }),
      turnup: () => http.request<WhosTurningUpDay[]>('/rosters/turnup'),
    },
  };
}

export type StaffClient = ReturnType<typeof createStaffClient>;
