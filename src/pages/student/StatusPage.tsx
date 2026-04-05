import { useQuery } from "@tanstack/react-query";
import { Descriptions, Select, Space, Table, Typography } from "antd";
import { useState } from "react";
import { CommitteeCard } from "../../components/common/CommitteeCard";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { StatusTag } from "../../components/status/StatusTag";
import { TimelineStatus } from "../../components/timeline/TimelineStatus";
import { getDocumentsByRegistration } from "../../services/documents.api";
import {
  getMyRegistrations,
  getRegistrationDetail,
  getRegistrationStatusHistory,
} from "../../services/registrations.api";
import { getScoresByRegistration } from "../../services/scores.api";
import type { ScoreRecord } from "../../types/models";
import { queryKeys } from "../../utils/query-keys";
import {
  getFileUrl,
  getRegistrationTitle,
  getRegistrationType,
} from "../../utils/registration";
import { buildTimelineFromRegistration } from "../../utils/status";

export default function StudentStatusPage() {
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<
    string | number
  >();

  const registrationsQuery = useQuery({
    queryKey: queryKeys.registrations({ scope: "me" }),
    queryFn: getMyRegistrations,
  });

  const currentRegistrationId =
    selectedRegistrationId ?? registrationsQuery.data?.[0]?.id;

  const detailQuery = useQuery({
    queryKey: queryKeys.registration(currentRegistrationId),
    queryFn: () => getRegistrationDetail(currentRegistrationId!),
    enabled: Boolean(currentRegistrationId),
  });

  const documentsQuery = useQuery({
    queryKey: queryKeys.documents(currentRegistrationId),
    queryFn: () => getDocumentsByRegistration(currentRegistrationId!),
    enabled: Boolean(currentRegistrationId),
  });

  const scoresQuery = useQuery({
    queryKey: queryKeys.scores(currentRegistrationId),
    queryFn: () => getScoresByRegistration(currentRegistrationId!),
    enabled: Boolean(currentRegistrationId),
  });

  const statusHistoryQuery = useQuery({
    queryKey: queryKeys.statusHistory(currentRegistrationId),
    queryFn: () => getRegistrationStatusHistory(currentRegistrationId!),
    enabled: Boolean(currentRegistrationId),
  });

  const registration = detailQuery.data;
  const isBcttRegistration = getRegistrationType(registration) === "BCTT";
  const scoreRows = scoresQuery.data ?? [];
  const visibleDocuments = (documentsQuery.data ?? []).filter(
    (document) => document.type !== "TURNITIN",
  );
  const timelineItems =
    (statusHistoryQuery.data?.length
      ? statusHistoryQuery.data.map((item) => ({
          status: item.status,
          label: item.statusLabel,
          description: item.note,
          createdAt: item.changedAt,
        }))
      : undefined) ?? buildTimelineFromRegistration(registration);

  const getRoleLabel = (role?: string) => {
    if (typeof role !== "string") {
      return "--";
    }

    if (role === "SUPERVISOR") {
      return "GVHD";
    }

    if (role === "REVIEWER") {
      return "Phản biện";
    }

    return role ?? "--";
  };

  const getScoreRoleLabel = (score: ScoreRecord) => {
    if (score.vaiTroChamLabel) {
      return score.vaiTroChamLabel;
    }

    return getRoleLabel(score.role);
  };

  const getTotalScore = (score: ScoreRecord) =>
    score.totalScore ?? score.finalScore ?? "--";

  return (
    <div className="page-stack">
      <PageHeader
        title="Theo dõi trạng thái"
        subtitle="Xem toàn bộ tiến trình hồ sơ, tài liệu đã nộp và kết quả chấm."
      />

      <SectionCard
        title="Chọn hồ sơ"
        extra={
          <Select
            style={{ minWidth: 260 }}
            value={currentRegistrationId}
            placeholder="Chọn registration"
            onChange={setSelectedRegistrationId}
            options={(registrationsQuery.data ?? []).map(
              (registrationItem) => ({
                label: getRegistrationTitle(registrationItem),
                value: registrationItem.id,
              }),
            )}
          />
        }
      >
        <Space direction="vertical" size={12}>
          <Typography.Text strong>
            {getRegistrationTitle(registration)}
          </Typography.Text>
          <StatusTag status={registration?.statusLabel} />
        </Space>
      </SectionCard>

      <div className="page-grid two-up">
        <SectionCard title="Timeline tiến trình">
          <TimelineStatus items={timelineItems} />
        </SectionCard>

        <SectionCard title="Thông tin hồ sơ">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Đề tài">
              {getRegistrationTitle(registration)}
            </Descriptions.Item>
            <Descriptions.Item label="GVHD">
              {registration?.supervisor?.fullName ?? "--"}
            </Descriptions.Item>
            {!isBcttRegistration ? (
              <Descriptions.Item label="GVPB">
                {registration?.reviewer?.fullName ?? "--"}
              </Descriptions.Item>
            ) : null}
            {!isBcttRegistration ? (
              <Descriptions.Item label="Supervisor approved">
                {registration?.supervisorApproved ? "Đã duyệt" : "Chưa duyệt"}
              </Descriptions.Item>
            ) : null}
            {!isBcttRegistration ? (
              <Descriptions.Item label="Chair approved">
                {registration?.chairApproved ? "Đã duyệt" : "Chưa duyệt"}
              </Descriptions.Item>
            ) : null}
          </Descriptions>
        </SectionCard>
      </div>

      {!isBcttRegistration ? (
        <CommitteeCard committeeId={registration?.committeeId} />
      ) : null}

      <div className="page-grid two-up">
        <SectionCard title="Tài liệu đã nộp">
          <Table
            rowKey="id"
            pagination={false}
            dataSource={visibleDocuments}
            columns={[
              { title: "Loại", dataIndex: "typeLabel" },
              {
                title: "Tệp",
                render: (_, record) => (
                  <a href={getFileUrl(record)} target="_blank" rel="noreferrer">
                    {record.fileName ?? record.name ?? "Xem file"}
                  </a>
                ),
              },
            ]}
          />
        </SectionCard>

        <SectionCard title="Điểm đã ghi nhận">
          <Table
            rowKey="id"
            pagination={false}
            dataSource={scoreRows}
            columns={[
              {
                title: "Vai trò",
                render: (_, record) => getScoreRoleLabel(record),
              },
              {
                title: "Tên giảng viên",
                dataIndex: "lecturerName",
                render: (value) => value ?? "--",
              },
              {
                title: "Điểm tổng",
                render: (_, record) => getTotalScore(record),
              },
              { title: "Nhận xét", dataIndex: "comments" },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  );
}
