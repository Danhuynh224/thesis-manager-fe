import { useQuery } from "@tanstack/react-query";
import { Descriptions } from "antd";
import { getCommitteeById } from "../../services/committees.api";
import { formatDateTimeVi } from "../../utils/datetime";
import { queryKeys } from "../../utils/query-keys";
import { getCommitteeMembers } from "../../utils/registration";
import { SectionCard } from "./SectionCard";

interface CommitteeCardProps {
  committeeId?: number | string | null;
}

export function CommitteeCard({ committeeId }: CommitteeCardProps) {
  const resolvedCommitteeId = committeeId ?? undefined;

  const committeeQuery = useQuery({
    queryKey: queryKeys.committee(resolvedCommitteeId),
    queryFn: () => getCommitteeById(resolvedCommitteeId!),
    enabled: Boolean(resolvedCommitteeId),
  });

  const currentCommittee = committeeQuery.data;
  const memberNames = getCommitteeMembers(currentCommittee)
    .map((member) => member?.fullName ?? "")
    .filter(Boolean)
    .join(", ");

  return (
    <SectionCard title="Thông tin hội đồng">
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Tên hội đồng">
          {currentCommittee?.name ?? "Chưa phân công"}
        </Descriptions.Item>
        <Descriptions.Item label="Đợt">
          {currentCommittee?.dot ?? "Chưa cập nhật"}
        </Descriptions.Item>
        <Descriptions.Item label="Chủ tịch">
          {currentCommittee?.chair?.fullName ??
            currentCommittee?.chairEmail ??
            "Chưa cập nhật"}
        </Descriptions.Item>
        <Descriptions.Item label="Thư ký">
          {currentCommittee?.secretary?.fullName ??
            currentCommittee?.secretaryEmail ??
            "Chưa cập nhật"}
        </Descriptions.Item>
        <Descriptions.Item label="Thành viên">
          {memberNames ||
            [currentCommittee?.member1Email, currentCommittee?.member2Email]
              .filter(Boolean)
              .join(", ") ||
            "Chưa cập nhật"}
        </Descriptions.Item>
        <Descriptions.Item label="Địa điểm">
          {currentCommittee?.location ?? "Chưa cập nhật"}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày bảo vệ">
          {formatDateTimeVi(currentCommittee?.defenseDate, "Chưa cập nhật")}
        </Descriptions.Item>
      </Descriptions>
    </SectionCard>
  );
}
