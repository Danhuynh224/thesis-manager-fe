import type { QueryParams } from '../types/api';
import type { Committee } from '../types/models';
import { unwrapResponse } from '../utils/response';
import { normalizeCommittee } from '../utils/mappers';
import { api } from './api';

export function getCommittees(params?: QueryParams) {
  return api
    .get('/committees', { params })
    .then(unwrapResponse<Committee[]>)
    .then((items) => items.map(normalizeCommittee));
}

export function getCommitteeById(id: number | string) {
  return api
    .get(`/committees/${id}`)
    .then(unwrapResponse<Committee>)
    .then(normalizeCommittee);
}

export function createCommittee(payload: Record<string, unknown>) {
  return api
    .post('/committees', {
      committeeName: payload.committeeName ?? payload.name,
      dot: payload.dot,
      chairEmail: payload.chairEmail ?? payload.chairId,
      secretaryEmail: payload.secretaryEmail ?? payload.secretaryId,
      member1Email: payload.member1Email,
      member2Email: payload.member2Email,
      location: payload.location,
      defenseDate: payload.defenseDate,
    })
    .then(unwrapResponse<Committee>)
    .then(normalizeCommittee);
}

export function updateCommittee(
  id: number | string,
  payload: Record<string, unknown>,
) {
  return api.patch(`/committees/${id}`, payload).then(unwrapResponse<Committee>).then(normalizeCommittee);
}

export function assignRegistration(
  committeeId: number | string,
  payload: Record<string, unknown>,
) {
  return api
    .post(`/committees/${committeeId}/assign-registration`, payload)
    .then(unwrapResponse<Committee>)
    .then(normalizeCommittee);
}
