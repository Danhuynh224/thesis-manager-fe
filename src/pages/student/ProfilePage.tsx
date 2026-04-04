import { useQuery } from "@tanstack/react-query";
import { Descriptions, Table, Typography } from "antd";
import { PageHeader } from "../../components/common/PageHeader";
import { SectionCard } from "../../components/common/SectionCard";
import { StatusTag } from "../../components/status/StatusTag";
import { getMyRegistrations } from "../../services/registrations.api";
import { getProfile } from "../../services/users.api";
import { queryKeys } from "../../utils/query-keys";
import {
  getRegistrationTitle,
  getRegistrationTypeLabel,
  getTermName,
} from "../../utils/registration";

export default function StudentProfilePage() {
  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: getProfile,
  });

  const registrationsQuery = useQuery({
    queryKey: queryKeys.registrations({ scope: "me" }),
    queryFn: getMyRegistrations,
  });

  return (
    <div className="page-stack">
      <PageHeader
        title="Thông tin chung"
        subtitle="Xem hồ sơ cá nhân và lịch sử đăng ký BCTT/KLTN."
      />

      <SectionCard title="Hồ sơ cá nhân">
        <Descriptions column={2}>
          <Descriptions.Item label="MSSV">
            {profileQuery.data?.studentCode ?? profileQuery.data?.id ?? "--"}
          </Descriptions.Item>
          <Descriptions.Item label="Họ tên">
            {profileQuery.data?.fullName ?? "--"}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {profileQuery.data?.email ?? "--"}
          </Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            {profileQuery.data?.role ?? "--"}
          </Descriptions.Item>
          <Descriptions.Item label="Chuyên ngành">
            {profileQuery.data?.major ?? "--"}
          </Descriptions.Item>
          <Descriptions.Item label="Hệ đào tạo">
            {profileQuery.data?.heDaoTao ?? "--"}
          </Descriptions.Item>
        </Descriptions>
      </SectionCard>

      <SectionCard title="Lịch sử đăng ký">
        <Table
          rowKey="id"
          dataSource={registrationsQuery.data ?? []}
          pagination={{ pageSize: 6 }}
          columns={[
            {
              title: "Đề tài",
              render: (_, record) => getRegistrationTitle(record),
            },
            {
              title: "Loại",
              render: (_, record) => getRegistrationTypeLabel(record),
            },
            {
              title: "Đợt",
              render: (_, record) => getTermName(record),
            },
            {
              title: "GVHD",
              render: (_, record) => record.supervisor?.fullName ?? "--",
            },
            {
              title: "Trạng thái",
              render: (_, record) => <StatusTag status={record.statusLabel} />,
            },
          ]}
          locale={{
            emptyText: (
              <Typography.Text type="secondary">
                Chưa có đăng ký nào.
              </Typography.Text>
            ),
          }}
        />
      </SectionCard>
    </div>
  );
}
