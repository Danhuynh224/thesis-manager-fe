import { Descriptions, Empty, Table, Typography } from "antd";
import { SectionCard } from "../common/SectionCard";
import type { ScoresByRegistration } from "../../types/models";

interface DefenseSummarySectionProps {
  scores?: ScoresByRegistration;
  loading?: boolean;
}

const committeeRoleLabelMap: Record<string, string> = {
  COMMITTEE_CHAIR: "Chủ tịch",
  COMMITTEE_SECRETARY: "Thư ký",
  COMMITTEE_MEMBER: "Thành viên hội đồng",
};

export function DefenseSummarySection({
  scores,
  loading,
}: DefenseSummarySectionProps) {
  if (!scores) {
    return (
      <SectionCard title="Tổng hợp kết quả bảo vệ">
        <Empty description="Chưa có dữ liệu điểm." />
      </SectionCard>
    );
  }

  const rows = [
    scores.supervisor
      ? {
          id: String(scores.supervisor.id),
          roleLabel: "GVHD",
          lecturerName: scores.supervisor.lecturerName,
          totalScore: scores.supervisor.totalScore,
          comments: scores.supervisor.comments,
        }
      : null,
    scores.reviewer
      ? {
          id: String(scores.reviewer.id),
          roleLabel: "GVPB",
          lecturerName: scores.reviewer.lecturerName,
          totalScore: scores.reviewer.totalScore,
          comments: scores.reviewer.comments,
        }
      : null,
    ...scores.committee.map((item, index) => ({
      id: String(item.id ?? `committee-${index}`),
      roleLabel: committeeRoleLabelMap[item.role ?? ""] ?? "Thành viên hội đồng",
      lecturerName: item.lecturerName,
      totalScore: item.totalScore,
      comments: item.comments,
    })),
  ].filter(Boolean) as Array<{
    id: string;
    roleLabel: string;
    lecturerName?: string;
    totalScore?: number;
    comments?: string;
  }>;

  return (
    <SectionCard title="Tổng hợp kết quả bảo vệ">
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Điểm final">
          <Typography.Text strong>
            {scores.final?.average ?? "--"}
          </Typography.Text>
        </Descriptions.Item>
      </Descriptions>
      <Table
        rowKey="id"
        loading={loading}
        pagination={false}
        dataSource={rows}
        columns={[
          { title: "Vai trò", dataIndex: "roleLabel" },
          {
            title: "Giảng viên",
            dataIndex: "lecturerName",
            render: (value) => value ?? "--",
          },
          {
            title: "Điểm tổng",
            dataIndex: "totalScore",
            render: (value) => value ?? "--",
          },
          {
            title: "Nhận xét",
            dataIndex: "comments",
            render: (value) => value ?? "--",
          },
        ]}
      />
    </SectionCard>
  );
}
