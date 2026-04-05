import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Segmented, Space, Typography, message } from "antd";
import { useMemo, useState } from "react";
import { MinutePanel } from "../../components/defense/MinutePanel";
import { RevisionReviewPanel } from "../../components/defense/RevisionReviewPanel";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import {
  ScoreForm,
  type ScoreFormValues,
} from "../../components/score/ScoreForm";
import { RegistrationTable } from "../../components/tables/RegistrationTable";
import { FileUploadCard } from "../../components/uploads/FileUploadCard";
import { getDocumentsByRegistration } from "../../services/documents.api";
import { getMinutesByRegistration } from "../../services/minutes.api";
import {
  approveRegistration,
  getRegistrationDetail,
  getRegistrations,
  rejectRegistration,
  updateStatus,
} from "../../services/registrations.api";
import { createScore } from "../../services/scores.api";
import { useAuthStore } from "../../store/auth.store";
import type { DocumentType, Registration } from "../../types/models";
import { getErrorMessage } from "../../utils/errors";
import {
  canSupervisorApproveKltn,
  canSupervisorScoreKltn,
  canSupervisorUploadTurnitin,
} from "../../utils/kltn-permissions";
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
  const [uploadDocumentType, setUploadDocumentType] = useState<DocumentType | null>(
    null,
  );
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [approveTitle, setApproveTitle] = useState("");
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  const registrationsQuery = useQuery({
    queryKey: queryKeys.registrations({ roleView: "supervisor", activeTab }),
    queryFn: () => getRegistrations({ roleView: "supervisor" }),
  });

  const detailQuery = useQuery({
    queryKey: queryKeys.registration(selectedRegistration?.id),
    queryFn: () => getRegistrationDetail(selectedRegistration!.id),
    enabled: Boolean(selectedRegistration?.id),
  });

  const documentsQuery = useQuery({
    queryKey: queryKeys.documents(selectedRegistration?.id),
    queryFn: () => getDocumentsByRegistration(selectedRegistration!.id),
    enabled: Boolean(selectedRegistration?.id && showRevisionModal),
  });

  const minutesQuery = useQuery({
    queryKey: queryKeys.minutes(selectedRegistration?.id),
    queryFn: () => getMinutesByRegistration(selectedRegistration!.id),
    enabled: Boolean(selectedRegistration?.id && showRevisionModal),
  });

  const refreshSelectedRegistrationData = async () => {
    if (!selectedRegistration?.id) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.registrations({
          roleView: "supervisor",
          activeTab,
        }),
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.scores(selectedRegistration.id),
      }),
    ]);
  };

  const approveMutation = useMutation({
    mutationFn: ({
      id,
      tenDeTai,
    }: {
      id: number | string;
      tenDeTai?: string;
    }) => approveRegistration(id, tenDeTai ? { tenDeTai } : undefined),
    onSuccess: async () => {
      message.success("Duyệt registration thành công.");
      setShowApproveModal(false);
      setSelectedRegistration(null);
      setApproveTitle("");
      await refreshSelectedRegistrationData();
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectRegistration,
    onSuccess: async () => {
      message.success("Từ chối registration thành công.");
      await queryClient.invalidateQueries({
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
    onSuccess: async () => {
      message.success("Cập nhật trạng thái thành công.");
      await refreshSelectedRegistrationData();
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
    onSuccess: async () => {
      message.success("Đã lưu điểm hướng dẫn.");
      setShowScoreModal(false);
      setSelectedRegistration(null);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.registrations({ roleView: "supervisor", activeTab }),
      });
    },
    onError: (error) => message.error(getErrorMessage(error)),
  });

  const filteredData = registrationsQuery.data ?? [];
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

  const getSubmissionFiles = (registration: Registration) =>
    registration.documents?.studentDocuments ?? [];

  const getRevisionFiles = (registration: Registration) =>
    (registration.documents?.studentDocuments ?? []).filter((file) =>
      ["REVISED_THESIS", "REVISION_EXPLANATION"].includes(file.type),
    );

  const openUploadModal = (
    registration: Registration,
    documentType: DocumentType,
  ) => {
    setSelectedRegistration(registration);
    setUploadDocumentType(documentType);
    setShowUploadModal(true);
  };

  const openApproveModal = (registration: Registration) => {
    setSelectedRegistration(registration);
    setApproveTitle(registration.title ?? "");
    setShowApproveModal(true);
  };

  const openRevisionModal = (registration: Registration) => {
    setSelectedRegistration(registration);
    setShowRevisionModal(true);
  };

  const closeApproveModal = () => {
    setShowApproveModal(false);
    setSelectedRegistration(null);
    setApproveTitle("");
  };

  const renderActions = (registration: Registration) => {
    if (registration.loai === "BCTT") {
      if (registration.status === "BCTT_PENDING_APPROVAL") {
        return (
          <Space wrap>
            <Button size="small" onClick={() => openApproveModal(registration)}>
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
        );
      }

      return null;
    }

    const actions = [];

    if (canSupervisorApproveKltn(registration)) {
      actions.push(
        <Button
          key="approve"
          size="small"
          onClick={() => openApproveModal(registration)}
        >
          Duyệt
        </Button>,
      );
      actions.push(
        <Button
          key="reject"
          size="small"
          danger
          onClick={() => rejectMutation.mutate(registration.id)}
        >
          Từ chối
        </Button>,
      );
    }

    if (canSupervisorUploadTurnitin(registration, currentUser?.email)) {
      actions.push(
        <Button
          key="turnitin"
          size="small"
          onClick={() => openUploadModal(registration, "TURNITIN")}
        >
          Turnitin
        </Button>,
      );
    }

    if (canSupervisorScoreKltn(registration)) {
      actions.push(
        <Button
          key="score"
          type="primary"
          size="small"
          onClick={() => {
            setSelectedRegistration(registration);
            setShowScoreModal(true);
          }}
        >
          Nhập điểm
        </Button>,
      );
    }

    if (registration.status === "WAITING_SUPERVISOR_REVISION_APPROVAL") {
      actions.push(
        <Button
          key="revision"
          size="small"
          onClick={() => openRevisionModal(registration)}
        >
          Duyệt chỉnh sửa
        </Button>,
      );
    }

    return actions.length ? <Space wrap>{actions}</Space> : null;
  };

  return (
    <div className="page-stack">
      <PageHeader
        title="Quản lý hướng dẫn"
        subtitle="Duyệt hồ sơ, upload Turnitin và xử lý các bước KLTN theo đúng trạng thái."
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

                      return fileUrl ? (
                        <a
                          key={String(file.id)}
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {file.fileName ?? "Xem file bài"}
                        </a>
                      ) : (
                        <Typography.Text key={String(file.id)} type="secondary">
                          {file.fileName ?? "Tệp không hợp lệ"}
                        </Typography.Text>
                      );
                    })}
                  </Space>
                );
              },
            },
            {
              title: "Tài liệu chỉnh sửa",
              render: (_, record) => {
                const revisionFiles = getRevisionFiles(record);

                if (!revisionFiles.length) {
                  return (
                    <Typography.Text type="secondary">
                      Chưa có tài liệu chỉnh sửa
                    </Typography.Text>
                  );
                }

                return (
                  <Space direction="vertical" size={4}>
                    {revisionFiles.map((file) => {
                      const fileUrl = getFileUrl(file);

                      return fileUrl ? (
                        <a
                          key={String(file.id)}
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {file.fileName ?? file.name ?? "Xem tài liệu chỉnh sửa"}
                        </a>
                      ) : (
                        <Typography.Text key={String(file.id)} type="secondary">
                          {file.fileName ?? "Tệp không hợp lệ"}
                        </Typography.Text>
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
        open={showApproveModal}
        onCancel={closeApproveModal}
        onOk={() => {
          if (!selectedRegistration) {
            return;
          }

          approveMutation.mutate({
            id: selectedRegistration.id,
            tenDeTai: approveTitle.trim(),
          });
        }}
        confirmLoading={approveMutation.isPending}
        title="Duyệt đăng ký"
      >
        <Form layout="vertical">
          <Form.Item label="Tên đề tài">
            <Input
              value={approveTitle}
              onChange={(event) => setApproveTitle(event.target.value)}
              placeholder="Nhập tên đề tài trước khi duyệt"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={showUploadModal}
        onCancel={() => {
          setShowUploadModal(false);
          setSelectedRegistration(null);
          setUploadDocumentType(null);
        }}
        footer={null}
        title="Upload tài liệu"
      >
        {selectedRegistration && uploadDocumentType ? (
          <FileUploadCard
            registrationId={selectedRegistration.id}
            documentType={uploadDocumentType}
            existingFiles={selectedRegistration.documents?.lecturerDocuments ?? []}
            onSuccess={async () => {
              setShowUploadModal(false);
              setSelectedRegistration(null);
              setUploadDocumentType(null);
              await queryClient.invalidateQueries({
                queryKey: queryKeys.registrations({
                  roleView: "supervisor",
                  activeTab,
                }),
              });
            }}
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

      <Modal
        open={showRevisionModal}
        onCancel={() => {
          setShowRevisionModal(false);
          setSelectedRegistration(null);
        }}
        footer={null}
        width={980}
        title="GVHD duyệt chỉnh sửa"
      >
        {selectedRegistration ? (
          <div className="page-stack">
            <MinutePanel minute={minutesQuery.data} loading={minutesQuery.isLoading} />
            <RevisionReviewPanel
              minute={minutesQuery.data}
              revisedThesis={revisedThesis}
              revisionExplanation={revisionExplanation}
              canApprove={
                currentRegistration?.status === "WAITING_SUPERVISOR_REVISION_APPROVAL"
              }
              canReject={
                currentRegistration?.status === "WAITING_SUPERVISOR_REVISION_APPROVAL"
              }
              loading={updateStatusMutation.isPending}
              onApprove={() =>
                updateStatusMutation.mutate({
                  id: selectedRegistration.id,
                  status: "WAITING_CHAIR_REVISION_APPROVAL",
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
