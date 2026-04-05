import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Modal, Space, Typography, message } from "antd";
import { useState } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { ScoreForm, type ScoreFormValues } from "../../components/score/ScoreForm";
import { RegistrationTable } from "../../components/tables/RegistrationTable";
import { getRegistrations } from "../../services/registrations.api";
import { createScore } from "../../services/scores.api";
import type { Registration } from "../../types/models";
import { getErrorMessage } from "../../utils/errors";
import { canReviewerScoreKltn } from "../../utils/kltn-permissions";
import { queryKeys } from "../../utils/query-keys";
import { getFileUrl } from "../../utils/registration";

export default function LecturerReviewerPage() {
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(
    null,
  );
  const queryClient = useQueryClient();

  const registrationsQuery = useQuery({
    queryKey: queryKeys.registrations({ roleView: "reviewer" }),
    queryFn: () => getRegistrations({ roleView: "reviewer" }),
  });

  const scoreMutation = useMutation({
    mutationFn: (values: ScoreFormValues & { registrationId: number | string }) =>
      createScore({ ...values, registrationId: values.registrationId, role: "REVIEWER" }),
    onSuccess: () => {
      message.success("Đã lưu điểm phản biện.");
      setSelectedRegistration(null);
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrations({ roleView: "reviewer" }),
      });
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const getSubmissionFiles = (registration: Registration) =>
    (registration.documents?.studentDocuments ?? []).filter(
      (file) => file.type === "KLTN_REPORT",
    );

  const getTurnitinFiles = (registration: Registration) =>
    (registration.documents?.lecturerDocuments ?? []).filter(
      (file) => file.type === "TURNITIN",
    );

  return (
    <div className="page-stack">
      <PageHeader
        title="Phản biện"
        subtitle="Xem bài KLTN, file Turnitin và chấm phản biện theo đúng trạng thái."
      />

      <SectionCard title="Danh sách phản biện">
        <RegistrationTable
          data={registrationsQuery.data ?? []}
          extraColumns={[
            {
              title: "Bài KLTN",
              render: (_, record) => {
                const submissionFiles = getSubmissionFiles(record);

                if (!submissionFiles.length) {
                  return <Typography.Text type="secondary">Chưa có file</Typography.Text>;
                }

                return (
                  <Space direction="vertical" size={4}>
                    {submissionFiles.map((file) => (
                      <a
                        key={String(file.id)}
                        href={getFileUrl(file)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {file.fileName ?? "Xem bài KLTN"}
                      </a>
                    ))}
                  </Space>
                );
              },
            },
            {
              title: "Turnitin",
              render: (_, record) => {
                const turnitinFiles = getTurnitinFiles(record);

                if (!turnitinFiles.length) {
                  return <Typography.Text type="secondary">Chưa có file</Typography.Text>;
                }

                return (
                  <Space direction="vertical" size={4}>
                    {turnitinFiles.map((file) => (
                      <a
                        key={String(file.id)}
                        href={getFileUrl(file)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {file.fileName ?? "Xem file Turnitin"}
                      </a>
                    ))}
                  </Space>
                );
              },
            },
          ]}
          actions={(registration) =>
            canReviewerScoreKltn(registration) ? (
              <Button
                type="primary"
                size="small"
                onClick={() => setSelectedRegistration(registration)}
              >
                Nhập điểm
              </Button>
            ) : null
          }
        />
      </SectionCard>

      <Modal
        open={Boolean(selectedRegistration)}
        onCancel={() => setSelectedRegistration(null)}
        footer={null}
        title="Nhập điểm phản biện"
      >
        {selectedRegistration ? (
          <ScoreForm
            loading={scoreMutation.isPending}
            showQuestions
            onSubmit={(values) =>
              scoreMutation.mutate({
                ...values,
                registrationId: selectedRegistration.id,
              })
            }
          />
        ) : null}
      </Modal>
    </div>
  );
}
