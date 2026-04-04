import { useMutation } from '@tanstack/react-query';
import { Button, Card, List, Space, Typography, Upload, message } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useState } from 'react';
import { uploadDocument } from '../../services/documents.api';
import type { DocumentRecord } from '../../types/models';
import { getErrorMessage } from '../../utils/errors';
import { getDocumentTypeLabel } from '../../utils/status';

interface FileUploadCardProps {
  registrationId: number | string;
  documentType: string;
  existingFiles?: DocumentRecord[];
  onSuccess?: () => void;
}

export function FileUploadCard({
  registrationId,
  documentType,
  existingFiles = [],
  onSuccess,
}: FileUploadCardProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const currentFile = fileList[0]?.originFileObj;

      if (!currentFile) {
        throw new Error('Vui lòng chọn một tệp trước khi tải lên.');
      }

      const formData = new FormData();
      formData.append('file', currentFile);
      formData.append('registrationId', String(registrationId));
      formData.append('documentType', documentType);

      return uploadDocument(formData);
    },
    onSuccess: () => {
      message.success('Tải tệp thành công.');
      setFileList([]);
      onSuccess?.();
    },
    onError: (error) => {
      message.error(getErrorMessage(error));
    },
  });

  return (
    <Card className="glass-panel" size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Typography.Text strong>
          {getDocumentTypeLabel(documentType)}
        </Typography.Text>
        <Upload
          beforeUpload={() => false}
          fileList={fileList}
          maxCount={1}
          onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
        >
          <Button>Chọn file</Button>
        </Upload>
        <Button
          type="primary"
          loading={uploadMutation.isPending}
          disabled={!fileList.length}
          onClick={() => uploadMutation.mutate()}
        >
          Tải lên
        </Button>

        <List
          size="small"
          dataSource={existingFiles.filter((item) => item.type === documentType)}
          locale={{ emptyText: 'Chưa có tệp đã tải.' }}
          renderItem={(item) => (
            <List.Item>
              <a href={item.fileUrl ?? item.url} target="_blank" rel="noreferrer">
                {item.fileName ?? item.name ?? 'Xem tệp'}
              </a>
            </List.Item>
          )}
        />
      </Space>
    </Card>
  );
}

