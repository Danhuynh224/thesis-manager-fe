import { Button, Descriptions, Empty, Space, Typography } from "antd";
import { SectionCard } from "../common/SectionCard";
import type { DocumentRecord, MinuteRecord } from "../../types/models";
import { getFileUrl } from "../../utils/registration";

interface RevisionReviewPanelProps {
  minute?: MinuteRecord | null;
  revisedThesis?: DocumentRecord;
  revisionExplanation?: DocumentRecord;
  supervisorApproved?: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  loading?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

function DocumentLink({
  label,
  document,
}: {
  label: string;
  document?: DocumentRecord;
}) {
  if (!document) {
    return <Typography.Text type="secondary">Chưa có {label.toLowerCase()}.</Typography.Text>;
  }

  return (
    <a href={getFileUrl(document)} target="_blank" rel="noreferrer">
      {document.fileName ?? document.name ?? label}
    </a>
  );
}

export function RevisionReviewPanel({
  minute,
  revisedThesis,
  revisionExplanation,
  supervisorApproved,
  canApprove,
  canReject,
  loading,
  onApprove,
  onReject,
}: RevisionReviewPanelProps) {
  return (
    <SectionCard title="Duyệt chỉnh sửa sau bảo vệ">
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Biên bản hội đồng">
            {minute?.fileUrl ?? minute?.url ? (
              <a href={minute.fileUrl ?? minute.url} target="_blank" rel="noreferrer">
                Mở biên bản hội đồng
              </a>
            ) : (
              "Chưa có biên bản"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Bài chỉnh sửa">
            <DocumentLink label="Bài chỉnh sửa" document={revisedThesis} />
          </Descriptions.Item>
          <Descriptions.Item label="Biên bản giải trình">
            <DocumentLink label="Biên bản giải trình" document={revisionExplanation} />
          </Descriptions.Item>
          {typeof supervisorApproved === "boolean" ? (
            <Descriptions.Item label="GVHD đã duyệt">
              {supervisorApproved ? "Đã duyệt" : "Chưa duyệt"}
            </Descriptions.Item>
          ) : null}
        </Descriptions>

        {!revisedThesis && !revisionExplanation && !minute ? (
          <Empty description="Chưa có đủ dữ liệu chỉnh sửa để duyệt." />
        ) : null}

        <Space wrap>
          <Button
            type="primary"
            disabled={!canApprove}
            loading={loading}
            onClick={onApprove}
          >
            Đồng ý chỉnh sửa
          </Button>
          <Button danger disabled={!canReject} loading={loading} onClick={onReject}>
            Không đồng ý
          </Button>
        </Space>
      </Space>
    </SectionCard>
  );
}
