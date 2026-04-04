import type {
  Committee,
  DocumentRecord,
  Registration,
  ScoreRecord,
} from '../types/models';

export function getRegistrationTitle(registration?: Registration | null) {
  return (
    registration?.topicTitle ??
    registration?.title ??
    'Chưa cập nhật tên đề tài'
  );
}

export function getRegistrationType(registration?: Registration | null) {
  return registration?.type ?? registration?.loai ?? 'BCTT';
}

export function getTermName(registration?: Registration | null) {
  return registration?.term?.name ?? registration?.term?.code ?? 'Chưa có đợt';
}

export function getLatestRegistration(
  registrations?: Registration[] | null,
  type?: 'BCTT' | 'KLTN',
) {
  if (!registrations?.length) {
    return undefined;
  }

  if (!type) {
    return registrations[0];
  }

  return registrations.find(
    (registration) => getRegistrationType(registration) === type,
  );
}

export function getLatestPassedBctt(registrations?: Registration[] | null) {
  return registrations?.find((registration) => registration.status === 'BCTT_PASSED');
}

export function getFileUrl(document?: DocumentRecord | null) {
  return document?.fileUrl ?? document?.url;
}

export function getCommitteeMembers(committee?: Committee | null) {
  if (!committee) {
    return [];
  }

  return [committee.chair, committee.secretary, ...(committee.members ?? [])].filter(
    Boolean,
  );
}

export function calculateAverageScore(scores?: ScoreRecord[] | null) {
  if (!scores?.length) {
    return undefined;
  }

  const totals = scores
    .map((score) => score.finalScore ?? score.totalScore)
    .filter((value): value is number => typeof value === 'number');

  if (!totals.length) {
    return undefined;
  }

  return Number(
    (totals.reduce((sum, value) => sum + value, 0) / totals.length).toFixed(2),
  );
}

export function getRegistrationTypeLabel(registration?: Registration | null) {
  const type = getRegistrationType(registration);

  if (type === 'BCTT') {
    return 'Báo cáo thực tập tốt nghiệp';
  }

  if (type === 'KLTN') {
    return 'Khóa luận tốt nghiệp';
  }

  return type;
}
