import type { AuthUser } from "./auth";

export type RegistrationType = "BCTT" | "KLTN";

export type DocumentType =
  | "BCTT_REPORT"
  | "INTERNSHIP_CONFIRMATION"
  | "KLTN_REPORT"
  | "REVISED_THESIS"
  | "REVISION_EXPLANATION"
  | "TURNITIN_REPORT"
  | "COMMITTEE_MINUTES";

export interface TimelineEntry {
  status: string;
  label?: string;
  description?: string;
  createdAt?: string;
}

export interface RegistrationStatusHistoryItem {
  id: string;
  registrationId: string;
  status: string;
  statusLabel?: string;
  changedBy?: string;
  changedByRole?: string;
  note?: string;
  changedAt?: string;
}

export interface Term {
  id: number | string;
  name: string;
  code?: string;
  type?: RegistrationType;
  loai?: RegistrationType;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface Committee {
  id: number | string;
  name?: string;
  chair?: AuthUser;
  secretary?: AuthUser;
  members?: AuthUser[];
  location?: string;
  defenseDate?: string;
}

export interface Registration {
  id: number | string;
  title?: string;
  topicTitle?: string;
  fieldName?: string;
  companyName?: string;
  type?: RegistrationType;
  loai?: RegistrationType;
  status: string;
  statusLabel?: string;
  student?: AuthUser;
  supervisor?: AuthUser;
  reviewer?: AuthUser;
  committee?: Committee;
  term?: Term;
  supervisorApproved?: boolean;
  chairApproved?: boolean;
  defenseDate?: string;
  defenseLocation?: string;
  finalScore?: number;
  statusHistory?: TimelineEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentRecord {
  id: number | string;
  type: DocumentType | string;
  typeLabel?: string;
  name?: string;
  fileName?: string;
  fileUrl?: string;
  url?: string;
  createdAt?: string;
}

export interface ScoreRecord {
  id: number | string;
  role?: string;
  score1?: number;
  score2?: number;
  score3?: number;
  totalScore?: number;
  finalScore?: number;
  comments?: string;
  questions?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id: number | string;
  title: string;
  content?: string;
  isRead?: boolean;
  createdAt?: string;
}

export interface Quota {
  id: number | string;
  lecturer?: AuthUser;
  quota: number;
  usedSlots?: number;
  remainingSlots?: number;
  approved?: boolean;
  term?: Term;
}

export interface MinuteRecord {
  id?: number | string;
  registrationId?: number | string;
  fileUrl?: string;
  url?: string;
  notes?: string;
  updatedAt?: string;
}

export interface TopicSuggestion {
  id: number | string;
  title: string;
  fieldName?: string;
  description?: string;
  status?: "OPEN" | "CLOSED";
  createdAt?: string;
}

export interface DeadlineSummary {
  title: string;
  dueAt?: string;
  description?: string;
}

export interface StudentDashboard {
  profile?: AuthUser;
  currentRegistration?: Registration | null;
  statusHistory?: TimelineEntry[];
  nextDeadline?: DeadlineSummary | null;
  notifications?: NotificationItem[];
}

export interface LecturerDashboard {
  supervisorCount?: number;
  reviewerCount?: number;
  committeeCount?: number;
  pendingTasks?: number;
  tasks?: Array<{
    label: string;
    description?: string;
    count?: number;
  }>;
}

export interface HeadDashboard {
  totalRegistrations?: number;
  pendingApprovals?: number;
  pendingReviewers?: number;
  pendingCommittees?: number;
  quotaOverview?: Array<{
    label: string;
    value: number | string;
  }>;
}

export interface SelectOption {
  label: string;
  value: string | number;
}
