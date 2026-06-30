import type {
  ApplyTemplateInput,
  ConfigCategoryInput,
  ConfigFieldInput,
  ConfigGateInput,
  ConfigGeneralInput,
  ConfigTermInput,
  IndustryTemplateSummary,
  ModuleCatalogEntry,
  ModuleToggleInput,
  OkResponse,
  OpenShift,
  PlannerAssignInput,
  PlannerCandidate,
  PlannerCascadeInput,
  PlannerCopyInput,
  PlannerFromTemplateInput,
  PlannerPublishRangeInput,
  PlannerRepeatInput,
  PlannerRespondInput,
  PlannerSummary,
  ResolvedConfig,
  RosterTemplateInput,
  RosterTemplateView,
  RosterWeek,
  StaffingRequirementInput,
  StaffingRequirementUpdate,
  StaffingRequirementView,
  WhosTurningUpDay,
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

/** Roster / Workforce Platform Builder client. */
export function createPlannerClient(http: HttpClient) {
  return {
    config: {
      get: () => http.request<ResolvedConfig>('/planner/config'),
      catalog: () => http.request<ModuleCatalogEntry[]>('/planner/config/catalog'),
      templates: () => http.request<IndustryTemplateSummary[]>('/planner/config/templates'),
      applyTemplate: (body: ApplyTemplateInput) =>
        http.request<ResolvedConfig>('/planner/config/apply-template', { method: 'POST', body }),
      patchGeneral: (body: ConfigGeneralInput) =>
        http.request<ResolvedConfig>('/planner/config/general', { method: 'PATCH', body }),
      toggleModule: (body: ModuleToggleInput) =>
        http.request<ResolvedConfig>('/planner/config/module', { method: 'PATCH', body }),
      setTerm: (body: ConfigTermInput) =>
        http.request<ResolvedConfig>('/planner/config/term', { method: 'PATCH', body }),
      setCategory: (body: ConfigCategoryInput) =>
        http.request<ResolvedConfig>('/planner/config/category', { method: 'PATCH', body }),
      removeCategory: (key: string) =>
        http.request<ResolvedConfig>(`/planner/config/category/${key}`, { method: 'DELETE' }),
      setGate: (body: ConfigGateInput) =>
        http.request<ResolvedConfig>('/planner/config/gate', { method: 'PATCH', body }),
      removeGate: (key: string) =>
        http.request<ResolvedConfig>(`/planner/config/gate/${key}`, { method: 'DELETE' }),
      setField: (body: ConfigFieldInput) =>
        http.request<ResolvedConfig>('/planner/config/field', { method: 'PATCH', body }),
      removeField: (key: string) =>
        http.request<ResolvedConfig>(`/planner/config/field/${key}`, { method: 'DELETE' }),
    },
    requirements: {
      list: (q?: { from?: string; to?: string }) =>
        http.request<StaffingRequirementView[]>(`/planner/requirements${qs(q ?? {})}`),
      create: (body: StaffingRequirementInput) =>
        http.request<StaffingRequirementView>('/planner/requirements', { method: 'POST', body }),
      update: (id: string, body: StaffingRequirementUpdate) =>
        http.request<StaffingRequirementView>(`/planner/requirements/${id}`, { method: 'PATCH', body }),
      remove: (id: string) =>
        http.request<OkResponse>(`/planner/requirements/${id}`, { method: 'DELETE' }),
      assign: (id: string, body: PlannerAssignInput) =>
        http.request<StaffingRequirementView>(`/planner/requirements/${id}/assign`, { method: 'POST', body }),
      autoFill: (id: string) =>
        http.request<StaffingRequirementView>(`/planner/requirements/${id}/auto-fill`, { method: 'POST' }),
      candidates: (id: string, q?: { sources?: string }) =>
        http.request<PlannerCandidate[]>(`/planner/requirements/${id}/candidates${qs(q ?? {})}`),
      publish: (id: string) =>
        http.request<StaffingRequirementView>(`/planner/requirements/${id}/publish`, { method: 'POST' }),
      repeat: (id: string, body: PlannerRepeatInput) =>
        http.request<StaffingRequirementView[]>(`/planner/requirements/${id}/repeat`, { method: 'POST', body }),
      cascade: (id: string, body?: PlannerCascadeInput) =>
        http.request<StaffingRequirementView>(`/planner/requirements/${id}/cascade`, { method: 'POST', body: body ?? {} }),
      claim: (id: string) =>
        http.request<StaffingRequirementView>(`/planner/requirements/${id}/claim`, { method: 'POST' }),
      fromTemplate: (body: PlannerFromTemplateInput) =>
        http.request<StaffingRequirementView>('/planner/requirements/from-template', { method: 'POST', body }),
      copy: (body: PlannerCopyInput) =>
        http.request<StaffingRequirementView[]>('/planner/requirements/copy', { method: 'POST', body }),
    },
    assignments: {
      respond: (id: string, body: PlannerRespondInput) =>
        http.request<OkResponse>(`/planner/assignments/${id}/respond`, { method: 'POST', body }),
      remove: (id: string) => http.request<OkResponse>(`/planner/assignments/${id}`, { method: 'DELETE' }),
    },
    templates: {
      list: () => http.request<RosterTemplateView[]>('/planner/templates'),
      create: (body: RosterTemplateInput) =>
        http.request<RosterTemplateView>('/planner/templates', { method: 'POST', body }),
      remove: (id: string) => http.request<OkResponse>(`/planner/templates/${id}`, { method: 'DELETE' }),
    },
    grid: (weekStart: string) => http.request<RosterWeek>(`/planner/grid${qs({ weekStart })}`),
    summary: (q?: { from?: string; to?: string }) =>
      http.request<PlannerSummary>(`/planner/summary${qs(q ?? {})}`),
    openShifts: (q?: { from?: string; to?: string }) =>
      http.request<OpenShift[]>(`/planner/open-shifts${qs(q ?? {})}`),
    turnup: (q?: { from?: string; to?: string }) =>
      http.request<WhosTurningUpDay[]>(`/planner/turnup${qs(q ?? {})}`),
    publishRange: (body: PlannerPublishRangeInput) =>
      http.request<OkResponse>('/planner/publish', { method: 'POST', body }),
  };
}

export type PlannerClient = ReturnType<typeof createPlannerClient>;
