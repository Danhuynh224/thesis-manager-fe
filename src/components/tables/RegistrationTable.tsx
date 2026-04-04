import type { ReactNode } from "react";
import { Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Registration } from "../../types/models";
import {
  getRegistrationTitle,
  getRegistrationTypeLabel,
  getTermName,
} from "../../utils/registration";
import { StatusTag } from "../status/StatusTag";

interface RegistrationTableProps {
  data: Registration[];
  extraColumns?: ColumnsType<Registration>;
  actions?: (registration: Registration) => ReactNode;
}

export function RegistrationTable({
  data,
  extraColumns = [],
  actions,
}: RegistrationTableProps) {
  const columns: ColumnsType<Registration> = [
    {
      title: "Sinh viên",
      render: (_, record) => (
        <div>
          <Typography.Text strong>
            {record.student?.fullName ?? "Chưa cập nhật"}
          </Typography.Text>
          <div className="field-hint">
            {record.student?.studentCode ?? record.student?.email}
          </div>
        </div>
      ),
    },
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
      title: "Trạng thái",
      render: (_, record) => <StatusTag status={record.statusLabel} />,
    },
    ...extraColumns,
  ];

  if (actions) {
    columns.push({
      title: "Thao tác",
      fixed: "right",
      render: (_, record) => actions(record),
    });
  }

  return (
    <Table
      rowKey="id"
      dataSource={data}
      columns={columns}
      scroll={{ x: 980 }}
      pagination={{ pageSize: 8 }}
    />
  );
}
