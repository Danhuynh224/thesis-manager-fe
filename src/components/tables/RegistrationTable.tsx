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
      width: 220,
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
      width: 180,
      render: (_, record) => getRegistrationTitle(record),
    },
    {
      title: "Loại",
      width: 140,
      render: (_, record) => getRegistrationTypeLabel(record),
    },
    {
      title: "Đợt",
      width: 180,
      render: (_, record) => getTermName(record),
    },
    {
      title: "Trạng thái",
      width: 190,
      render: (_, record) => <StatusTag status={record.statusLabel} />,
    },
    ...extraColumns,
  ];

  if (actions) {
    columns.push({
      title: "Thao tác",
      fixed: "right",
      width: 160,
      render: (_, record) => actions(record),
    });
  }

  return (
    <Table
      className="registration-table"
      rowKey="id"
      dataSource={data}
      columns={columns}
      scroll={{ x: 1280 }}
      pagination={{ pageSize: 8 }}
    />
  );
}
