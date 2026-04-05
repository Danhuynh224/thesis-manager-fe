import type {
  DocumentType,
  Registration,
  TimelineEntry,
} from "../types/models";
import { getKltnStepperOrder, isKltnRegistration } from "./kltn-permissions";

export function getDisplayStatus(status?: string) {
  if (status === "DEFENSE_SCHEDULED") {
    return "WAITING_COMMITTEE_SCORE";
  }

  return status;
}

export const statusMetaMap: Record<
  string,
  {
    label: string;
    color:
      | "default"
      | "processing"
      | "success"
      | "error"
      | "warning"
      | "blue"
      | "purple"
      | "cyan"
      | "green"
      | "magenta"
      | "orange"
      | "red"
      | "volcano"
      | "gold"
      | "lime"
      | "geekblue";
  }
> = {
  BCTT_PENDING_APPROVAL: { label: "Chờ duyệt BCTT", color: "warning" },
  BCTT_APPROVED: { label: "BCTT đã được duyệt", color: "success" },
  BCTT_IN_PROGRESS: { label: "Đang thực hiện BCTT", color: "processing" },
  BCTT_SUBMITTED: { label: "Đã nộp báo cáo BCTT", color: "cyan" },
  BCTT_PASSED: { label: "BCTT đạt", color: "success" },
  BCTT_FAILED: { label: "BCTT không đạt", color: "error" },
  KLTN_PENDING_APPROVAL: { label: "Chờ duyệt KLTN", color: "warning" },
  KLTN_APPROVED: { label: "KLTN đã được duyệt", color: "success" },
  KLTN_IN_PROGRESS: { label: "Đang thực hiện KLTN", color: "processing" },
  KLTN_SUBMITTED: { label: "Đã nộp khóa luận", color: "cyan" },
  WAITING_TURNITIN: { label: "Chờ Turnitin", color: "blue" },
  WAITING_SUPERVISOR_SCORE: { label: "Chờ GVHD chấm", color: "geekblue" },
  WAITING_REVIEWER_SCORE: { label: "Chờ phản biện chấm", color: "purple" },
  WAITING_COMMITTEE_ASSIGNMENT: {
    label: "Chờ phân công hội đồng",
    color: "orange",
  },
  WAITING_COMMITTEE_SCORE: { label: "Chờ hội đồng chấm", color: "magenta" },
  DEFENSE_SCHEDULED: { label: "Chờ hội đồng chấm", color: "magenta" },
  DEFENDED: { label: "Đã bảo vệ", color: "lime" },
  WAITING_REVISED_UPLOAD: {
    label: "Chờ nộp bản chỉnh sửa",
    color: "orange",
  },
  WAITING_SUPERVISOR_REVISION_APPROVAL: {
    label: "Chờ GVHD duyệt bản chỉnh sửa",
    color: "geekblue",
  },
  WAITING_CHAIR_REVISION_APPROVAL: {
    label: "Chờ chủ tịch duyệt bản chỉnh sửa",
    color: "purple",
  },
  COMPLETED: { label: "Hoàn thành", color: "success" },
  REJECTED_AFTER_DEFENSE: { label: "Không đạt sau bảo vệ", color: "error" },
  KLTN_REJECTED: { label: "KLTN bị từ chối", color: "error" },
};

export const documentTypeLabels: Record<DocumentType, string> = {
  BCTT_REPORT: "Báo cáo BCTT",
  INTERNSHIP_CONFIRMATION: "Phiếu xác nhận thực tập",
  KLTN_REPORT: "Báo cáo KLTN",
  REVISED_THESIS: "Luận văn chỉnh sửa",
  REVISION_EXPLANATION: "Giải trình chỉnh sửa",
  TURNITIN: "Báo cáo Turnitin",
  REVIEW_ATTACHMENT: "Tài liệu phản biện",
  SUPERVISOR_ATTACHMENT: "Tài liệu GVHD",
  COMMITTEE_MINUTES: "Biên bản hội đồng",
};

export function getDocumentTypeLabel(documentType?: string) {
  if (!documentType) {
    return "Chưa xác định";
  }

  return (
    documentTypeLabels[documentType as DocumentType] ??
    documentType
      .split("_")
      .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
      .join(" ")
  );
}

export const registrationTypeLabels = {
  BCTT: "Báo cáo thực tập tốt nghiệp",
  KLTN: "Khóa luận tốt nghiệp",
} as const;

export function getRegistrationTypeLabel(registrationType?: string) {
  if (!registrationType) {
    return "Chưa xác định";
  }

  return (
    registrationTypeLabels[
      registrationType as keyof typeof registrationTypeLabels
    ] ?? registrationType
  );
}

export function getStatusMeta(status?: string) {
  const displayStatus = getDisplayStatus(status);

  if (!displayStatus) {
    return { label: "Chưa xác định", color: "default" as const };
  }

  return statusMetaMap[displayStatus] ?? {
    label: displayStatus,
    color: "default" as const,
  };
}

export function buildTimelineFromRegistration(
  registration?: Registration | null,
) {
  if (!registration) {
    return [];
  }

  if (registration.statusHistory?.length) {
    return registration.statusHistory;
  }

  if (isKltnRegistration(registration)) {
    const kltnOrder = getKltnStepperOrder() as string[];
    const displayStatus = getDisplayStatus(registration.status) ?? "";
    const currentIndex = kltnOrder.indexOf(displayStatus);

    return kltnOrder
      .slice(0, currentIndex >= 0 ? currentIndex + 1 : 0)
      .map(
        (status, index): TimelineEntry => ({
          status,
          label: getStatusMeta(status).label,
          createdAt:
            index === 0
              ? registration.createdAt
              : status === displayStatus
                ? registration.updatedAt
                : undefined,
        }),
      );
  }

  const items: TimelineEntry[] = [
    {
      status: "SUBMITTED",
      label: "Đăng ký",
      description: "Hồ sơ đã được tạo trong hệ thống.",
      createdAt: registration.createdAt,
    },
  ];

  if (registration.status) {
    items.push({
      status: registration.status,
      label: getStatusMeta(registration.status).label,
      createdAt: registration.updatedAt,
    });
  }

  return items;
}

export function getAllowedUploadTypes(status?: string): DocumentType[] {
  switch (status) {
    case "WAITING_REVISED_UPLOAD":
      return ["REVISED_THESIS", "REVISION_EXPLANATION"];
    case "KLTN_APPROVED":
    case "KLTN_IN_PROGRESS":
    case "KLTN_SUBMITTED":
    case "WAITING_TURNITIN":
    case "WAITING_SUPERVISOR_SCORE":
    case "WAITING_REVIEWER_SCORE":
      return ["KLTN_REPORT"];
    case "BCTT_APPROVED":
    case "BCTT_IN_PROGRESS":
      return ["BCTT_REPORT", "INTERNSHIP_CONFIRMATION"];
    default:
      return [];
  }
}
