import type { DocumentRecord, Registration } from "../types/models";

const KLTN_ASSIGNABLE_STATUSES = [
  "KLTN_APPROVED",
  "KLTN_SUBMITTED",
  "WAITING_TURNITIN",
  "WAITING_SUPERVISOR_SCORE",
  "WAITING_REVIEWER_SCORE",
  "WAITING_COMMITTEE_ASSIGNMENT",
] as const;

const KLTN_STEPPER_ORDER = [
  "KLTN_PENDING_APPROVAL",
  "KLTN_APPROVED",
  "KLTN_IN_PROGRESS",
  "KLTN_SUBMITTED",
  "WAITING_TURNITIN",
  "WAITING_SUPERVISOR_SCORE",
  "WAITING_REVIEWER_SCORE",
  "WAITING_COMMITTEE_ASSIGNMENT",
  "WAITING_COMMITTEE_SCORE",
  "DEFENDED",
  "WAITING_REVISED_UPLOAD",
  "WAITING_SUPERVISOR_REVISION_APPROVAL",
  "WAITING_CHAIR_REVISION_APPROVAL",
  "COMPLETED",
  "REJECTED_AFTER_DEFENSE",
  "KLTN_REJECTED",
] as const;

export function isKltnRegistration(registration?: Registration | null) {
  return registration?.loai === "KLTN";
}

export function hasDocumentType(
  documents: DocumentRecord[] | undefined,
  documentType: string,
) {
  return (documents ?? []).some((document) => document.type === documentType);
}

export function canStudentUploadKltnReport(registration?: Registration | null) {
  return (
    isKltnRegistration(registration) &&
    registration?.status !== "KLTN_PENDING_APPROVAL" &&
    registration?.status !== "WAITING_REVISED_UPLOAD"
  );
}

export function canStudentSubmitKltn(
  registration?: Registration | null,
  documents?: DocumentRecord[],
) {
  return (
    isKltnRegistration(registration) &&
    ["KLTN_APPROVED", "KLTN_IN_PROGRESS"].includes(registration?.status ?? "") &&
    hasDocumentType(documents, "KLTN_REPORT")
  );
}

export function canStudentUploadRevision(registration?: Registration | null) {
  return registration?.status === "WAITING_REVISED_UPLOAD";
}

export function canSupervisorApproveKltn(registration?: Registration | null) {
  return registration?.status === "KLTN_PENDING_APPROVAL";
}

export function canSupervisorUploadTurnitin(
  registration?: Registration | null,
  userEmail?: string,
) {
  return (
    isKltnRegistration(registration) &&
    registration?.emailGVHD === userEmail &&
    [
      "KLTN_SUBMITTED",
      "WAITING_TURNITIN",
      "WAITING_SUPERVISOR_SCORE",
      "DEFENSE_SCHEDULED",
    ].includes(registration?.status ?? "")
  );
}

export function canSupervisorUploadAttachment(
  registration?: Registration | null,
  userEmail?: string,
) {
  return isKltnRegistration(registration) && registration?.emailGVHD === userEmail;
}

export function canSupervisorScoreKltn(registration?: Registration | null) {
  return [
    "WAITING_SUPERVISOR_SCORE",
    "WAITING_REVIEWER_SCORE",
    "WAITING_COMMITTEE_ASSIGNMENT",
    "WAITING_COMMITTEE_SCORE",
    "DEFENSE_SCHEDULED",
  ].includes(registration?.status ?? "");
}

export function canReviewerUploadAttachment(
  registration?: Registration | null,
  userEmail?: string,
) {
  return isKltnRegistration(registration) && registration?.emailGVPB === userEmail;
}

export function canReviewerScoreKltn(registration?: Registration | null) {
  return ["WAITING_REVIEWER_SCORE", "DEFENSE_SCHEDULED"].includes(
    registration?.status ?? "",
  );
}

export function canManagerAssignCommittee(registration?: Registration | null) {
  return (
    isKltnRegistration(registration) &&
    KLTN_ASSIGNABLE_STATUSES.includes(
      (registration?.status ?? "") as (typeof KLTN_ASSIGNABLE_STATUSES)[number],
    )
  );
}

export function canSecretaryUploadMinutes(
  registration?: Registration | null,
  userEmail?: string,
) {
  return registration?.committee?.secretaryEmail === userEmail;
}

export function canCommitteeScoreKltn(registration?: Registration | null) {
  return ["WAITING_COMMITTEE_SCORE", "DEFENSE_SCHEDULED"].includes(
    registration?.status ?? "",
  );
}

export function getKltnStepperOrder() {
  return [...KLTN_STEPPER_ORDER];
}
