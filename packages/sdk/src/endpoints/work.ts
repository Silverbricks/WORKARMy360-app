import type {
  AssignInput,
  AssignmentView,
  AttendanceView,
  ClockInput,
  OkResponse,
  Payslip,
  PayslipInput,
  Shift,
  ShiftInput,
  ShiftWithAssignments,
  TimesheetView,
  WorkerShift,
} from '@workarmy/types';
import type { HttpClient } from '../http';

export function createWorkClient(http: HttpClient) {
  return {
    // --- provider (org) ---
    listShifts: () => http.request<ShiftWithAssignments[]>('/shifts'),
    createShift: (body: ShiftInput) => http.request<Shift>('/shifts', { method: 'POST', body }),
    cancelShift: (id: string) => http.request<Shift>(`/shifts/${id}/cancel`, { method: 'POST' }),
    assign: (shiftId: string, body: AssignInput) =>
      http.request<AssignmentView>(`/shifts/${shiftId}/assign`, { method: 'POST', body }),
    unassign: (assignmentId: string) =>
      http.request<OkResponse>(`/shifts/assignments/${assignmentId}`, { method: 'DELETE' }),

    // --- worker (person) ---
    myShifts: () => http.request<WorkerShift[]>('/shifts/me'),
    confirm: (assignmentId: string) =>
      http.request<OkResponse>(`/shifts/assignments/${assignmentId}/confirm`, { method: 'POST' }),
    clockIn: (assignmentId: string, body: ClockInput = {}) =>
      http.request<AttendanceView>(`/shifts/assignments/${assignmentId}/clock-in`, { method: 'POST', body }),
    clockOut: (assignmentId: string, body: ClockInput = {}) =>
      http.request<AttendanceView>(`/shifts/assignments/${assignmentId}/clock-out`, { method: 'POST', body }),
    requestSwap: (assignmentId: string) =>
      http.request<OkResponse>(`/shifts/assignments/${assignmentId}/swap`, { method: 'POST', body: {} }),

    // --- timesheets ---
    myTimesheets: () => http.request<TimesheetView[]>('/timesheets/me'),
    generateTimesheet: () => http.request<TimesheetView>('/timesheets/generate', { method: 'POST' }),
    orgTimesheets: (status?: string) =>
      http.request<TimesheetView[]>(`/timesheets${status ? `?status=${status}` : ''}`),
    approveTimesheet: (id: string) =>
      http.request<OkResponse>(`/timesheets/${id}/approve`, { method: 'POST' }),
    rejectTimesheet: (id: string) =>
      http.request<OkResponse>(`/timesheets/${id}/reject`, { method: 'POST' }),

    // --- payslips ---
    myPayslips: () => http.request<Payslip[]>('/payslips/me'),
    orgPayslips: () => http.request<Payslip[]>('/payslips'),
    issuePayslip: (body: PayslipInput) => http.request<Payslip>('/payslips', { method: 'POST', body }),
  };
}

export type WorkClient = ReturnType<typeof createWorkClient>;
