export const queryKeys = {
  me: ['me'] as const,
  lecturers: (params?: unknown) => ['lecturers', params] as const,
  students: (params?: unknown) => ['students', params] as const,
  profile: ['profile'] as const,
  myFields: ['myFields'] as const,
  terms: (params?: unknown) => ['terms', params] as const,
  quotas: (params?: unknown) => ['quotas', params] as const,
  registrations: (params?: unknown) => ['registrations', params] as const,
  registration: (id?: number | string) => ['registration', id] as const,
  statusHistory: (registrationId?: number | string) =>
    ['statusHistory', registrationId] as const,
  documents: (registrationId?: number | string) =>
    ['documents', registrationId] as const,
  scores: (registrationId?: number | string) =>
    ['scores', registrationId] as const,
  committees: (params?: unknown) => ['committees', params] as const,
  committee: (id?: number | string) => ['committee', id] as const,
  notifications: (params?: unknown) => ['notifications', params] as const,
  dashboard: (role: string) => ['dashboard', role] as const,
  minutes: (registrationId?: number | string) =>
    ['minutes', registrationId] as const,
  topicSuggestions: ['topicSuggestions'] as const,
} as const;
