import type { AuthUser, LoginResult, Role } from "../types/auth";
import type {
  Committee,
  DocumentRecord,
  MinuteRecord,
  NotificationItem,
  Quota,
  Registration,
  RegistrationStatusHistoryItem,
  ScoreRecord,
  StudentDashboard,
  Term,
} from "../types/models";
import { getDocumentTypeLabel } from "./status";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function asNumericValue(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

export function normalizeUser(input: unknown): AuthUser {
  const raw = asRecord(input);
  const role =
    (raw.role as Role | undefined) ??
    (raw.msgv || raw.emailGVHD || raw.emailGVPB ? "LECTURER" : "STUDENT");
  const email = asString(raw.email) ?? "";

  return {
    id: asString(raw.id) ?? asString(raw.ms) ?? asString(raw.msgv) ?? email,
    email,
    fullName:
      asString(raw.fullName) ??
      asString(raw.ten) ??
      asString(raw.name) ??
      email,
    role,
    studentCode: asString(raw.studentCode) ?? asString(raw.ms),
    lecturerCode: asString(raw.lecturerCode) ?? asString(raw.msgv),
    phoneNumber: asString(raw.phoneNumber),
    major:
      asString(raw.major) ??
      (Array.isArray(raw.majors) ? asString(raw.majors[0]) : undefined),
    heDaoTao: asString(raw.heDaoTao),
  };
}

export function normalizeLoginResult(input: unknown): LoginResult {
  const raw = asRecord(input);

  return {
    accessToken: asString(raw.accessToken) ?? "",
    user: normalizeUser(raw.user),
  };
}

export function normalizeTerm(input: unknown): Term {
  const raw = asRecord(input);
  const code =
    asString(raw.code) ??
    asString(raw.dot) ??
    asString(raw.tenDot) ??
    asString(raw.name);

  return {
    id: asString(raw.id) ?? code ?? "",
    name:
      asString(raw.name) ?? asString(raw.tenDot) ?? code ?? "Chưa có tên đợt",
    code,
    type: raw.type as Term["type"],
    loai: raw.loai as Term["loai"],
    isActive: asBoolean(raw.isActive),
    startDate: asString(raw.startDate) ?? asString(raw.registrationOpenAt),
    endDate: asString(raw.endDate) ?? asString(raw.registrationCloseAt),
  };
}

export function normalizeCommittee(input: unknown): Committee {
  const raw = asRecord(input);
  const memberObjects = Array.isArray(raw.members) ? raw.members : [];

  return {
    id: asString(raw.id) ?? "",
    name: asString(raw.name) ?? asString(raw.committeeName),
    dot: asString(raw.dot),
    chairEmail: asString(raw.chairEmail),
    secretaryEmail: asString(raw.secretaryEmail),
    member1Email: asString(raw.member1Email),
    member2Email: asString(raw.member2Email),
    chair: raw.chair
      ? normalizeUser(raw.chair)
      : raw.chairEmail
        ? normalizeUser({
            email: raw.chairEmail,
            ten: raw.chairEmail,
            role: "LECTURER",
          })
        : undefined,
    secretary: raw.secretary
      ? normalizeUser(raw.secretary)
      : raw.secretaryEmail
        ? normalizeUser({
            email: raw.secretaryEmail,
            ten: raw.secretaryEmail,
            role: "LECTURER",
          })
        : undefined,
    members: [...memberObjects, raw.member1, raw.member2]
      .filter(Boolean)
      .map((member) => normalizeUser(member))
      .concat(
        [raw.member1Email, raw.member2Email]
          .filter((value): value is string => typeof value === "string")
          .map((email) =>
            normalizeUser({
              email,
              ten: email,
              role: "LECTURER",
            }),
          ),
      ),
    location: asString(raw.location),
    defenseDate: asString(raw.defenseDate),
    createdAt: asString(raw.createdAt),
  };
}

export function normalizeRegistration(input: unknown): Registration {
  const raw = asRecord(input);
  const approvalStates = asRecord(raw.approvalStates);
  const documents = asRecord(raw.documents);

  return {
    id: asString(raw.id) ?? "",
    title: asString(raw.title) ?? asString(raw.tenDeTai),
    topicTitle:
      asString(raw.topicTitle) ?? asString(raw.tenDeTai) ?? asString(raw.title),
    fieldName: asString(raw.fieldName) ?? asString(raw.linhVuc),
    companyName: asString(raw.companyName) ?? asString(raw.tenCongTy),
    type:
      (raw.type as Registration["type"]) ?? (raw.loai as Registration["loai"]),
    loai: raw.loai as Registration["loai"],
    status: asString(raw.status) ?? "DRAFT",
    statusLabel: asString(raw.statusLabel) ?? asString(raw.label),
    student: raw.student
      ? normalizeUser(raw.student)
      : raw.emailSV
        ? normalizeUser({
            email: raw.emailSV,
            ten: raw.emailSV,
            role: "STUDENT",
            ms: raw.ms,
          })
        : undefined,
    supervisor: raw.supervisor
      ? normalizeUser(raw.supervisor)
      : raw.emailGVHD
        ? normalizeUser({
            email: raw.emailGVHD,
            ten: raw.emailGVHD,
            role: "LECTURER",
          })
        : undefined,
    reviewer: raw.reviewer
      ? normalizeUser(raw.reviewer)
      : raw.emailGVPB
        ? normalizeUser({
            email: raw.emailGVPB,
            ten: raw.emailGVPB,
            role: "LECTURER",
          })
        : undefined,
    committee: raw.committee ? normalizeCommittee(raw.committee) : undefined,
    committeeId: asString(raw.committeeId),
    term: raw.term
      ? normalizeTerm(raw.term)
      : raw.dot || raw.tenDot
        ? normalizeTerm({
            id: raw.dot ?? raw.tenDot,
            dot: raw.dot ?? raw.tenDot,
            tenDot: raw.tenDot ?? raw.dot,
            loai: raw.loai,
          })
        : undefined,
    supervisorApproved:
      asBoolean(raw.supervisorApproved) ??
      asBoolean(approvalStates.supervisorApproved),
    chairApproved:
      asBoolean(raw.chairApproved) ?? asBoolean(approvalStates.chairApproved),
    defenseDate: asString(raw.defenseDate),
    defenseLocation: asString(raw.defenseLocation) ?? asString(raw.location),
    finalScore: asNumber(raw.finalScore),
    documents: {
      studentDocuments: Array.isArray(documents.studentDocuments)
        ? documents.studentDocuments.map(normalizeDocument)
        : [],
      lecturerDocuments: Array.isArray(documents.lecturerDocuments)
        ? documents.lecturerDocuments.map(normalizeDocument)
        : [],
    },
    statusHistory: Array.isArray(raw.statusHistory)
      ? raw.statusHistory.map((item) => {
          const entry = asRecord(item);
          return {
            status: asString(entry.status) ?? "DRAFT",
            label: asString(entry.label) ?? asString(entry.statusLabel),
            description: asString(entry.description) ?? asString(entry.note),
            createdAt: asString(entry.createdAt) ?? asString(entry.changedAt),
          };
        })
      : undefined,
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  };
}

export function normalizeRegistrationStatusHistoryItem(
  input: unknown,
): RegistrationStatusHistoryItem {
  const raw = asRecord(input);

  return {
    id: asString(raw.id) ?? "",
    registrationId: asString(raw.registrationId) ?? "",
    status: asString(raw.status) ?? "DRAFT",
    statusLabel: asString(raw.statusLabel) ?? asString(raw.label),
    changedBy: asString(raw.changedBy),
    changedByRole: asString(raw.changedByRole),
    note: asString(raw.note) ?? asString(raw.description),
    changedAt: asString(raw.changedAt) ?? asString(raw.createdAt),
  };
}

export function normalizeDocument(input: unknown): DocumentRecord {
  const raw = asRecord(input);
  const type = asString(raw.type) ?? asString(raw.documentType) ?? "BCTT_REPORT";

  return {
    id: asString(raw.id) ?? "",
    type,
    typeLabel: getDocumentTypeLabel(type),
    name: asString(raw.name),
    fileName: asString(raw.fileName),
    fileUrl: asString(raw.fileUrl),
    url: asString(raw.url),
    createdAt: asString(raw.createdAt) ?? asString(raw.uploadedAt),
  };
}

export function flattenDocuments(input: unknown): DocumentRecord[] {
  if (Array.isArray(input)) {
    return input.map(normalizeDocument);
  }

  const raw = asRecord(input);
  const studentDocuments = Array.isArray(raw.studentDocuments)
    ? raw.studentDocuments.map(normalizeDocument)
    : [];
  const lecturerDocuments = Array.isArray(raw.lecturerDocuments)
    ? raw.lecturerDocuments.map(normalizeDocument)
    : [];

  return [...studentDocuments, ...lecturerDocuments];
}

export function normalizeScore(input: unknown): ScoreRecord {
  const raw = asRecord(input);

  return {
    id:
      asString(raw.id) ??
      `${asString(raw.vaiTroCham) ?? asString(raw.role) ?? "score"}-${asString(raw.emailCham) ?? "row"}`,
    role: asString(raw.role) ?? asString(raw.vaiTroCham),
    lecturerName:
      asString(raw.lecturerName) ??
      asString(raw.tenGV) ??
      asString(raw.teacherName) ??
      asString(raw.emailGV),
    score1: asNumericValue(raw.score1),
    score2: asNumericValue(raw.score2),
    score3: asNumericValue(raw.score3),
    totalScore: asNumericValue(raw.totalScore),
    finalScore: asNumericValue(raw.finalScore) ?? asNumericValue(raw.average),
    comments: asString(raw.comments),
    questions: asString(raw.questions),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  };
}

export function flattenScores(input: unknown): ScoreRecord[] {
  if (Array.isArray(input)) {
    return input.map(normalizeScore);
  }

  const raw = asRecord(input);
  const committee = Array.isArray(raw.committee)
    ? raw.committee.map(normalizeScore)
    : [];
  const scores = [
    raw.supervisor
      ? normalizeScore({
          ...asRecord(raw.supervisor),
          vaiTroCham: "SUPERVISOR",
        })
      : null,
    raw.reviewer
      ? normalizeScore({ ...asRecord(raw.reviewer), vaiTroCham: "REVIEWER" })
      : null,
    ...committee,
  ].filter((item): item is ScoreRecord => Boolean(item));

  return scores;
}

export function normalizeMinute(input: unknown): MinuteRecord {
  const raw = asRecord(input);

  return {
    id: asString(raw.id),
    registrationId: asString(raw.registrationId),
    fileUrl: asString(raw.fileUrl),
    url: asString(raw.url),
    notes: asString(raw.notes) ?? asString(raw.content),
    updatedAt: asString(raw.updatedAt),
  };
}

export function normalizeNotification(input: unknown): NotificationItem {
  const raw = asRecord(input);

  return {
    id: asString(raw.id) ?? "",
    title: asString(raw.title) ?? asString(raw.message) ?? "Thông báo",
    content: asString(raw.content) ?? asString(raw.message),
    isRead: asBoolean(raw.isRead),
    createdAt: asString(raw.createdAt),
  };
}

export function normalizeQuota(input: unknown): Quota {
  const raw = asRecord(input);

  return {
    id: asString(raw.id) ?? "",
    lecturer: raw.lecturer
      ? normalizeUser(raw.lecturer)
      : raw.emailGV
        ? normalizeUser({
            email: raw.emailGV,
            ten: raw.emailGV,
            role: "LECTURER",
          })
        : undefined,
    quota: asNumber(raw.quota) ?? 0,
    usedSlots: asNumber(raw.usedSlots),
    remainingSlots: asNumber(raw.remainingSlots),
    approved: asBoolean(raw.approved),
    term: raw.term
      ? normalizeTerm(raw.term)
      : raw.dot
        ? normalizeTerm({ dot: raw.dot, tenDot: raw.dot })
        : undefined,
  };
}

export function normalizeRegistrationDetail(input: unknown) {
  const raw = asRecord(input);

  return {
    registration: normalizeRegistration(raw.registration ?? input),
    documents: flattenDocuments(raw.documents),
    scores: flattenScores(raw.scores),
    committee: raw.committee ? normalizeCommittee(raw.committee) : undefined,
    notifications: Array.isArray(raw.notifications)
      ? raw.notifications.map(normalizeNotification)
      : [],
  };
}

export function normalizeStudentDashboard(input: unknown): StudentDashboard {
  const raw = asRecord(input);

  return {
    profile: raw.profile ? normalizeUser(raw.profile) : undefined,
    currentRegistration: raw.currentRegistration
      ? normalizeRegistration(raw.currentRegistration)
      : null,
    statusHistory: Array.isArray(raw.statusHistory)
      ? raw.statusHistory.map((item) => {
          const entry = asRecord(item);
          return {
            status: asString(entry.status) ?? "DRAFT",
            label: asString(entry.label),
            description: asString(entry.description),
            createdAt: asString(entry.createdAt),
          };
        })
      : undefined,
    nextDeadline: raw.nextDeadline
      ? {
          title: asString(asRecord(raw.nextDeadline).title) ?? "Deadline",
          description: asString(asRecord(raw.nextDeadline).description),
          dueAt: asString(asRecord(raw.nextDeadline).dueAt),
        }
      : null,
    notifications: Array.isArray(raw.notifications)
      ? raw.notifications.map(normalizeNotification)
      : [],
  };
}
