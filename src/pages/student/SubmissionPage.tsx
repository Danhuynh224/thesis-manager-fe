import { useQuery } from '@tanstack/react-query';
import { Empty, Select } from 'antd';
import { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { FileUploadCard } from '../../components/uploads/FileUploadCard';
import { getDocumentsByRegistration } from '../../services/documents.api';
import { getMyRegistrations } from '../../services/registrations.api';
import { queryKeys } from '../../utils/query-keys';
import {
  getLatestRegistration,
  getRegistrationTitle,
} from '../../utils/registration';
import { getAllowedUploadTypes } from '../../utils/status';
import type { DocumentType, Registration } from '../../types/models';

export default function StudentSubmissionPage() {
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<
    string | number
  >();

  const registrationsQuery = useQuery({
    queryKey: queryKeys.registrations({ scope: 'me' }),
    queryFn: getMyRegistrations,
  });

  const currentRegistrationId =
    selectedRegistrationId ?? getLatestRegistration(registrationsQuery.data)?.id;

  const activeRegistration = (registrationsQuery.data ?? []).find(
    (item) => item.id === currentRegistrationId,
  );

  const documentsQuery = useQuery({
    queryKey: queryKeys.documents(currentRegistrationId),
    queryFn: () => getDocumentsByRegistration(currentRegistrationId!),
    enabled: Boolean(currentRegistrationId),
  });

  const resolveUploadTypes = (
    registration?: Registration,
  ): DocumentType[] => {
    if (!registration) {
      return [];
    }

    if (registration.loai === 'KLTN') {
      return ['KLTN_REPORT'];
    }

    return getAllowedUploadTypes(registration.status);
  };

  const uploadTypes = resolveUploadTypes(activeRegistration);

  return (
    <div className="page-stack">
      <PageHeader
        title="Nộp hồ sơ"
        subtitle="Chỉ hiển thị đúng loại tệp tương ứng với trạng thái hồ sơ hiện tại."
      />

      <SectionCard
        title="Chọn hồ sơ để upload"
        extra={
          <Select
            style={{ minWidth: 280 }}
            value={currentRegistrationId}
            onChange={setSelectedRegistrationId}
            options={(registrationsQuery.data ?? []).map((registration) => ({
              label: getRegistrationTitle(registration),
              value: registration.id,
            }))}
          />
        }
      >
        {activeRegistration ? (
          <div className="page-grid two-up">
            {uploadTypes.map((documentType) => (
              <FileUploadCard
                key={documentType}
                registrationId={activeRegistration.id}
                documentType={documentType}
                existingFiles={documentsQuery.data ?? []}
                onSuccess={() => documentsQuery.refetch()}
              />
            ))}
          </div>
        ) : (
          <Empty description="Chưa có hồ sơ để nộp." />
        )}
      </SectionCard>
    </div>
  );
}
