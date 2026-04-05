import { Button, Empty, Space, Typography } from "antd";
import { SectionCard } from "../common/SectionCard";
import type { MinuteRecord } from "../../types/models";

interface MinutePanelProps {
  minute?: MinuteRecord | null;
  loading?: boolean;
  generating?: boolean;
  onOpenOrGenerate?: () => void;
}

export function MinutePanel({
  minute,
  loading,
  generating,
  onOpenOrGenerate,
}: MinutePanelProps) {
  return (
    <SectionCard
      title="Biên bản hội đồng"
      extra={
        <Button loading={generating} onClick={onOpenOrGenerate}>
          Mở biên bản hội đồng
        </Button>
      }
    >
      {loading ? (
        <Typography.Text type="secondary">Đang tải biên bản...</Typography.Text>
      ) : minute ? (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Typography.Paragraph style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
            {minute.content ?? minute.notes ?? "Chưa có nội dung preview."}
          </Typography.Paragraph>
          {minute.fileUrl ?? minute.url ? (
            <a href={minute.fileUrl ?? minute.url} target="_blank" rel="noreferrer">
              Mở file PDF
            </a>
          ) : (
            <Typography.Text type="secondary">
              Chưa có file PDF biên bản.
            </Typography.Text>
          )}
        </Space>
      ) : (
        <Empty description="Chưa có biên bản hội đồng." />
      )}
    </SectionCard>
  );
}
