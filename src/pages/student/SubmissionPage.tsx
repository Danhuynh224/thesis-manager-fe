import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Empty, Select, Space, message } from "antd";
import { useEffect, useState } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { FileUploadCard } from "../../components/uploads/FileUploadCard";
import { getDocumentsByRegistration } from "../../services/documents.api";
import { getMyRegistrations, updateStatus } from "../../services/registrations.api";
import type { DocumentType, Registration } from "../../types/models";
import { getErrorMessage } from "../../utils/errors";
import {
  canStudentSubmitKltn,
  canStudentUploadKltnReport,
  canStudentUploadRevision,
} from "../../utils/kltn-permissions";
import { queryKeys } from "../../utils/query-keys";
import {
  getFileUrl,
  getLatestRegistration,
  getRegistrationTitle,
} from "../../utils/registration";
import { getAllowedUploadTypes, getDocumentTypeLabel } from "../../utils/status";

export default function StudentSubmissionPage() {
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<
    string | number
  >();
  const [selectedUploadType, setSelectedUploadType] = useState<DocumentType>();
  const queryClient = useQueryClient();

  const registrationsQuery = useQuery({
    queryKey: queryKeys.registrations({ scope: "me" }),
    queryFn: getMyRegistrations,
  });

  const currentRegistrationId =
    selectedRegistrationId ?? getLatestRegistration(registrationsQuery.data)?.id;

  const activeRegistration = (registrationsQuery.data ?? []).find(
    (item) => item.id === currentRegistrationId,
  );

  const documentsQuery = useQuery({
    queryKey: queryKeys.documents(currentRegistrationId),
    queryFn: () => getDocumentsByRegistration(currentRegistrationId!),
    enabled: Boolean(currentRegistrationId),
  });

  const submitKltnMutation = useMutation({
    mutationFn: (registrationId: number | string) =>
      updateStatus(registrationId, { status: "KLTN_SUBMITTED" }),
    onSuccess: async () => {
      message.success("Đã cập nhật trạng thái khóa luận.");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.registrations({ scope: "me" }),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.documents(currentRegistrationId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.registration(currentRegistrationId),
        }),
      ]);
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const resolveUploadTypes = (registration?: Registration): DocumentType[] => {
    if (!registration) {
      return [];
    }

    if (canStudentUploadRevision(registration)) {
      return ["REVISED_THESIS", "REVISION_EXPLANATION"];
    }

    if (canStudentUploadKltnReport(registration)) {
      return ["KLTN_REPORT"];
    }

    return getAllowedUploadTypes(registration.status).filter(
      (type) => !["KLTN_REPORT", "REVISED_THESIS", "REVISION_EXPLANATION"].includes(type),
    ) as DocumentType[];
  };

  const uploadTypes = resolveUploadTypes(activeRegistration);
  const isBcttRegistration = activeRegistration?.loai === "BCTT";
  const effectiveUploadType =
    isBcttRegistration && uploadTypes.length
      ? selectedUploadType && uploadTypes.includes(selectedUploadType)
        ? selectedUploadType
        : uploadTypes[0]
      : undefined;
  const canSubmitKltnNow = canStudentSubmitKltn(
    activeRegistration,
    documentsQuery.data ?? [],
  );
  const revisionDocuments = (documentsQuery.data ?? []).filter((document) =>
    ["REVISED_THESIS", "REVISION_EXPLANATION"].includes(document.type),
  );

  const hasRequiredRevisionDocuments = (documentTypes: string[]) =>
    documentTypes.includes("REVISED_THESIS") &&
    documentTypes.includes("REVISION_EXPLANATION");

  const handleUploadSuccess = async () => {
    const refetchedDocuments = await documentsQuery.refetch();

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrations({ scope: "me" }),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.registration(activeRegistration?.id),
      }),
    ]);

    if (
      activeRegistration?.status === "WAITING_REVISED_UPLOAD" &&
      hasRequiredRevisionDocuments(
        (refetchedDocuments.data ?? []).map((document) => document.type),
      )
    ) {
      await updateStatus(activeRegistration.id, {
        status: "WAITING_SUPERVISOR_REVISION_APPROVAL",
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.registrations({ scope: "me" }),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.documents(activeRegistration.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.registration(activeRegistration.id),
        }),
      ]);

      message.success("Đã nộp đủ 2 tài liệu chỉnh sửa và chuyển sang chờ GVHD duyệt.");
    }
  };

  useEffect(() => {
    if (!isBcttRegistration || !uploadTypes.length) {
      setSelectedUploadType(undefined);
      return;
    }

    setSelectedUploadType((currentValue) =>
      currentValue && uploadTypes.includes(currentValue)
        ? currentValue
        : uploadTypes[0],
    );
  }, [isBcttRegistration, uploadTypes]);

  return (
    <div className="page-stack">
      <PageHeader
        title="Nộp hồ sơ"
        subtitle="Chỉ hiển thị đúng loại tệp tương ứng với trạng thái hồ sơ hiện tại."
      />

      <SectionCard
        title="Chọn hồ sơ để upload"
        extra={
          <Select
            style={{ minWidth: 280 }}
            value={currentRegistrationId}
            onChange={setSelectedRegistrationId}
            options={(registrationsQuery.data ?? []).map((registration) => ({
              label: getRegistrationTitle(registration),
              value: registration.id,
            }))}
          />
        }
      >
        {activeRegistration ? (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {canSubmitKltnNow ? (
              <Button
                type="primary"
                onClick={() => submitKltnMutation.mutate(activeRegistration.id)}
                loading={submitKltnMutation.isPending}
              >
                Đã nộp khóa luận
              </Button>
            ) : null}

            {uploadTypes.length ? (
              isBcttRegistration ? (
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  <Select
                    style={{ minWidth: 320 }}
                    value={effectiveUploadType}
                    onChange={(value) => setSelectedUploadType(value as DocumentType)}
                    options={uploadTypes.map((documentType) => ({
                      label: getDocumentTypeLabel(documentType),
                      value: documentType,
                    }))}
                  />
                  {effectiveUploadType ? (
                    <FileUploadCard
                      key={`${activeRegistration.id}-${effectiveUploadType}`}
                      registrationId={activeRegistration.id}
                      documentType={effectiveUploadType}
                      existingFiles={documentsQuery.data ?? []}
                      onSuccess={handleUploadSuccess}
                    />
                  ) : null}
                </Space>
              ) : (
                <div className="page-grid two-up">
                  {uploadTypes.map((documentType) => (
                    <FileUploadCard
                      key={documentType}
                      registrationId={activeRegistration.id}
                      documentType={documentType}
                      existingFiles={documentsQuery.data ?? []}
                      onSuccess={handleUploadSuccess}
                    />
                  ))}
                </div>
              )
            ) : (
              <Empty description="Không có tài liệu nào được phép upload ở bước này." />
            )}

            {revisionDocuments.length ? (
              <SectionCard title="Tài liệu chỉnh sửa đã nộp">
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  {revisionDocuments.map((document) => (
                    <a
                      key={String(document.id)}
                      href={getFileUrl(document)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {getDocumentTypeLabel(document.type)}:{" "}
                      {document.fileName ?? document.name ?? "Xem tệp"}
                    </a>
                  ))}
                </Space>
              </SectionCard>
            ) : null}
          </Space>
        ) : (
          <Empty description="Chưa có hồ sơ để nộp." />
        )}
      </SectionCard>
    </div>
  );
}
