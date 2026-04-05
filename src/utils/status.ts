import type {
  DocumentType,
  Registration,
  TimelineEntry,
} from "../types/models";

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
  DRAFT: { label: "Nháp", color: "default" },
  SUBMITTED: { label: "Đã nộp", color: "processing" },
  PENDING_APPROVAL: { label: "Chờ duyệt", color: "warning" },
  APPROVED: { label: "Đã duyệt", color: "success" },
  REJECTED: { label: "Từ chối", color: "error" },
  BCTT_PASSED: { label: "BCTT đạt", color: "success" },
  IN_PROGRESS: { label: "Đang thực hiện", color: "processing" },
  WAITING_REVIEW: { label: "Chờ phản biện", color: "geekblue" },
  WAITING_DEFENSE: { label: "Chờ bảo vệ", color: "purple" },
  AFTER_DEFENSE: { label: "Sau bảo vệ", color: "cyan" },
  WAITING_REVISION: { label: "Chờ chỉnh sửa", color: "orange" },
  REVISION_APPROVED: { label: "Đã duyệt chỉnh sửa", color: "success" },
  COMPLETED: { label: "Hoàn thành", color: "success" },
};

export const documentTypeLabels: Record<DocumentType, string> = {
  BCTT_REPORT: "Báo cáo BCTT",
  INTERNSHIP_CONFIRMATION: "Xác nhận thực tập",
  KLTN_REPORT: "Báo cáo KLTN",
  REVISED_THESIS: "Luận văn chỉnh sửa",
  REVISION_EXPLANATION: "Giải trình chỉnh sửa",
  TURNITIN: "Báo cáo Turnitin",
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
  if (!status) {
    return { label: "Chưa xác định", color: "default" as const };
  }

  return statusMetaMap[status] ?? { label: status, color: "default" as const };
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
    case "IN_PROGRESS":
      return ["BCTT_REPORT", "INTERNSHIP_CONFIRMATION", "KLTN_REPORT"];
    case "WAITING_REVISION":
      return ["REVISED_THESIS", "REVISION_EXPLANATION"];
    case "WAITING_REVIEW":
    case "WAITING_DEFENSE":
    case "AFTER_DEFENSE":
      return ["KLTN_REPORT"];
    default:
      return ["BCTT_REPORT"];
  }
}
