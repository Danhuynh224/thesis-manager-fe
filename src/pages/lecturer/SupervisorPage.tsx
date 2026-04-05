import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Modal, Segmented, Space, Typography, message } from "antd";
import { useState } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import {
  ScoreForm,
  type ScoreFormValues,
} from "../../components/score/ScoreForm";
import { RegistrationTable } from "../../components/tables/RegistrationTable";
import { FileUploadCard } from "../../components/uploads/FileUploadCard";
import {
  approveRegistration,
  getRegistrations,
  rejectRegistration,
  updateStatus,
} from "../../services/registrations.api";
import { createScore } from "../../services/scores.api";
import type { Registration } from "../../types/models";
import { getErrorMessage } from "../../utils/errors";
import { queryKeys } from "../../utils/query-keys";
import { getFileUrl } from "../../utils/registration";

const supervisorTabs = [
  "Tất cả",
  "Chờ duyệt",
  "Đang thực hiện",
  "Chờ chấm",
  "Sau bảo vệ",
];

export default function LecturerSupervisorPage() {
  const [activeTab, setActiveTab] = useState(supervisorTabs[0]);
  const [selectedRegistration, setSelectedRegistration] =
    useState<Registration | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const queryClient = useQueryClient();

  const registrationsQuery = useQuery({
    queryKey: queryKeys.registrations({ roleView: "supervisor", activeTab }),
    queryFn: () => getRegistrations({ roleView: "supervisor" }),
  });

  const approveMutation = useMutation({
    mutationFn: approveRegistration,
    onSuccess: () => {
      message.success("Duyệt registration thành công.");
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrations({
          roleView: "supervisor",
          activeTab,
        }),
      });
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectRegistration,
    onSuccess: () => {
      message.success("Từ chối registration thành công.");
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrations({
          roleView: "supervisor",
          activeTab,
        }),
      });
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: string }) =>
      updateStatus(id, { status }),
    onSuccess: () => {
      message.success("Cập nhật trạng thái thành công.");
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrations({
          roleView: "supervisor",
          activeTab,
        }),
      });
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const scoreMutation = useMutation({
    mutationFn: (
      values: ScoreFormValues & { registrationId: number | string },
    ) =>
      createScore({
        ...values,
        registrationId: values.registrationId,
        role: "SUPERVISOR",
      }),
    onSuccess: () => {
      message.success("Đã lưu điểm hướng dẫn.");
      setShowScoreModal(false);
      setSelectedRegistration(null);
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const filteredData = (registrationsQuery.data ?? []).filter(
    (registration) => {
      if (activeTab === "Tất cả") {
        return true;
      }

      if (activeTab === "Chờ duyệt") {
        return ["PENDING_APPROVAL", "SUBMITTED"].includes(registration.status);
      }

      if (activeTab === "Đang thực hiện") {
        return ["APPROVED", "IN_PROGRESS"].includes(registration.status);
      }

      if (activeTab === "Chờ chấm") {
        return ["WAITING_REVIEW", "WAITING_DEFENSE"].includes(
          registration.status,
        );
      }

      return [
        "AFTER_DEFENSE",
        "WAITING_REVISION",
        "REVISION_APPROVED",
      ].includes(registration.status);
    },
  );

  const getSubmissionFiles = (registration: Registration) =>
    registration.documents?.studentDocuments ?? [];

  const renderActions = (registration: Registration) => {
    if (registration.loai === "BCTT") {
      if (registration.status === "BCTT_PENDING_APPROVAL") {
        return (
          <Space wrap>
            <Button
              size="small"
              onClick={() => approveMutation.mutate(registration.id)}
            >
              Duyệt
            </Button>
            <Button
              size="small"
              danger
              onClick={() => rejectMutation.mutate(registration.id)}
            >
              Từ chối
            </Button>
          </Space>
        );
      }

      if (registration.status === "BCTT_SUBMITTED") {
        return (
          <Space wrap>
            <Button
              type="primary"
              size="small"
              onClick={() => {
                setSelectedRegistration(registration);
                setShowScoreModal(true);
              }}
            >
              Nhập điểm
            </Button>
          </Space>
        );
      }

      return null;
    }

    return (
      <Space wrap>
        <Button
          size="small"
          onClick={() => approveMutation.mutate(registration.id)}
        >
          Duyệt
        </Button>
        <Button
          size="small"
          danger
          onClick={() => rejectMutation.mutate(registration.id)}
        >
          Từ chối
        </Button>
        <Button
          size="small"
          onClick={() => {
            setSelectedRegistration(registration);
            setShowUploadModal(true);
          }}
        >
          Turnitin
        </Button>
        <Button
          type="primary"
          size="small"
          onClick={() => {
            setSelectedRegistration(registration);
            setShowScoreModal(true);
          }}
        >
          Nhập điểm
        </Button>
        <Button
          size="small"
          onClick={() =>
            updateStatusMutation.mutate({
              id: registration.id,
              status: "SUPERVISOR_APPROVED",
            })
          }
        >
          Duyệt chỉnh sửa
        </Button>
      </Space>
    );
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Quản lý hướng dẫn"
        subtitle="Duyệt hồ sơ, upload Turnitin, nhập điểm hướng dẫn và xử lý hậu bảo vệ."
      />

      <SectionCard
        title="Danh sách sinh viên hướng dẫn"
        extra={
          <Segmented
            options={supervisorTabs}
            value={activeTab}
            onChange={setActiveTab}
          />
        }
      >
        <RegistrationTable
          data={filteredData}
          extraColumns={[
            {
              title: "File bài",
              render: (_, record) => {
                const submissionFiles = getSubmissionFiles(record);

                if (!submissionFiles.length) {
                  return (
                    <Typography.Text type="secondary">
                      Chờ sinh viên nộp
                    </Typography.Text>
                  );
                }

                return (
                  <Space direction="vertical" size={4}>
                    {submissionFiles.map((file) => {
                      const fileUrl = getFileUrl(file);

                      if (!fileUrl) {
                        return (
                          <Typography.Text key={String(file.id)} type="secondary">
                            {file.fileName ?? "Tệp không hợp lệ"}
                          </Typography.Text>
                        );
                      }

                      return (
                        <a
                          key={String(file.id)}
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {file.fileName ?? "Xem file bài"}
                        </a>
                      );
                    })}
                  </Space>
                );
              },
            },
          ]}
          actions={renderActions}
        />
      </SectionCard>

      <Modal
        open={showUploadModal}
        onCancel={() => {
          setShowUploadModal(false);
          setSelectedRegistration(null);
        }}
        footer={null}
        title="Upload Turnitin"
      >
        {selectedRegistration ? (
          <FileUploadCard
            registrationId={selectedRegistration.id}
            documentType="TURNITIN"
          />
        ) : null}
      </Modal>

      <Modal
        open={showScoreModal}
        onCancel={() => {
          setShowScoreModal(false);
          setSelectedRegistration(null);
        }}
        footer={null}
        title="Nhập điểm hướng dẫn"
      >
        {selectedRegistration ? (
          <ScoreForm
            loading={scoreMutation.isPending}
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
