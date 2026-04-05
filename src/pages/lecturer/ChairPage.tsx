import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Modal, message } from "antd";
import { useMemo, useState } from "react";
import { MinutePanel } from "../../components/defense/MinutePanel";
import { RevisionReviewPanel } from "../../components/defense/RevisionReviewPanel";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { RegistrationTable } from "../../components/tables/RegistrationTable";
import { getDocumentsByRegistration } from "../../services/documents.api";
import { getMinutesByRegistration } from "../../services/minutes.api";
import {
  getRegistrationDetail,
  getRegistrations,
  updateStatus,
} from "../../services/registrations.api";
import type { Registration } from "../../types/models";
import { getErrorMessage } from "../../utils/errors";
import { queryKeys } from "../../utils/query-keys";
import { getFileUrl } from "../../utils/registration";

export default function LecturerChairPage() {
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(
    null,
  );
  const queryClient = useQueryClient();

  const registrationsQuery = useQuery({
    queryKey: queryKeys.registrations({ roleView: "chair" }),
    queryFn: () => getRegistrations({ roleView: "chair" }),
  });

  const detailQuery = useQuery({
    queryKey: queryKeys.registration(selectedRegistration?.id),
    queryFn: () => getRegistrationDetail(selectedRegistration!.id),
    enabled: Boolean(selectedRegistration?.id),
  });

  const documentsQuery = useQuery({
    queryKey: queryKeys.documents(selectedRegistration?.id),
    queryFn: () => getDocumentsByRegistration(selectedRegistration!.id),
    enabled: Boolean(selectedRegistration?.id),
  });

  const minutesQuery = useQuery({
    queryKey: queryKeys.minutes(selectedRegistration?.id),
    queryFn: () => getMinutesByRegistration(selectedRegistration!.id),
    enabled: Boolean(selectedRegistration?.id),
  });

  const refreshSelectedRegistrationData = async () => {
    if (!selectedRegistration?.id) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrations({ roleView: "chair" }),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.registration(selectedRegistration.id),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents(selectedRegistration.id),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.minutes(selectedRegistration.id),
      }),
    ]);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number | string;
      status: string;
    }) => updateStatus(id, { status }),
    onSuccess: async () => {
      message.success("Đã cập nhật trạng thái chỉnh sửa.");
      await refreshSelectedRegistrationData();
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const currentRegistration = detailQuery.data ?? selectedRegistration;
  const revisedThesis = useMemo(
    () => (documentsQuery.data ?? []).find((item) => item.type === "REVISED_THESIS"),
    [documentsQuery.data],
  );
  const revisionExplanation = useMemo(
    () =>
      (documentsQuery.data ?? []).find(
        (item) => item.type === "REVISION_EXPLANATION",
      ),
    [documentsQuery.data],
  );

  const getRevisionFiles = (registration: Registration) =>
    (registration.documents?.studentDocuments ?? []).filter((file) =>
      ["REVISED_THESIS", "REVISION_EXPLANATION"].includes(file.type),
    );

  return (
    <div className="page-stack">
      <PageHeader
        title="Chủ tịch hội đồng"
        subtitle="Duyệt bài chỉnh sửa sau khi GVHD đã xác nhận hoàn tất."
      />

      <SectionCard title="Danh sách chờ duyệt chỉnh sửa">
        <RegistrationTable
          data={registrationsQuery.data ?? []}
          extraColumns={[
            {
              title: "GVHD duyệt",
              render: (_, record) =>
                record.supervisorApproved ? "Đã duyệt" : "Chưa duyệt",
            },
            {
              title: "Chủ tịch duyệt",
              render: (_, record) =>
                record.chairApproved ? "Đã duyệt" : "Chưa duyệt",
            },
            {
              title: "Tài liệu chỉnh sửa",
              render: (_, record) => {
                const revisionFiles = getRevisionFiles(record);

                if (!revisionFiles.length) {
                  return "Chưa có";
                }

                return (
                  <div>
                    {revisionFiles.map((file) => {
                      const fileUrl = getFileUrl(file);

                      return fileUrl ? (
                        <div key={String(file.id)}>
                          <a href={fileUrl} target="_blank" rel="noreferrer">
                            {file.fileName ?? file.name ?? "Xem tài liệu"}
                          </a>
                        </div>
                      ) : null;
                    })}
                  </div>
                );
              },
            },
          ]}
          actions={(registration) => (
            <Button
              type="primary"
              size="small"
              onClick={() => setSelectedRegistration(registration)}
            >
              Xem duyệt chỉnh sửa
            </Button>
          )}
        />
      </SectionCard>

      <Modal
        open={Boolean(selectedRegistration)}
        onCancel={() => setSelectedRegistration(null)}
        footer={null}
        width={980}
        title="Duyệt chỉnh sửa sau bảo vệ"
      >
        {selectedRegistration ? (
          <div className="page-stack">
            <MinutePanel minute={minutesQuery.data} loading={minutesQuery.isLoading} />
            <RevisionReviewPanel
              minute={minutesQuery.data}
              revisedThesis={revisedThesis}
              revisionExplanation={revisionExplanation}
              supervisorApproved={currentRegistration?.supervisorApproved}
              canApprove={
                currentRegistration?.status === "WAITING_CHAIR_REVISION_APPROVAL"
              }
              canReject={
                currentRegistration?.status === "WAITING_CHAIR_REVISION_APPROVAL"
              }
              loading={updateStatusMutation.isPending}
              onApprove={() =>
                updateStatusMutation.mutate({
                  id: selectedRegistration.id,
                  status: "COMPLETED",
                })
              }
              onReject={() =>
                updateStatusMutation.mutate({
                  id: selectedRegistration.id,
                  status: "WAITING_REVISED_UPLOAD",
                })
              }
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
