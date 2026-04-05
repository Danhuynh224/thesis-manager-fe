import type { ScoreRecord } from '../types/models';
import { unwrapResponse } from '../utils/response';
import { flattenScores, normalizeScore, normalizeScoresByRegistration } from '../utils/mappers';
import { api } from './api';

export function createScore(payload: Record<string, unknown>) {
  return api
    .post('/scores', {
      registrationId: payload.registrationId,
      vaiTroCham: payload.vaiTroCham ?? payload.role,
      score1: payload.score1,
      score2: payload.score2,
      score3: payload.score3,
      totalScore: payload.totalScore,
      comments: payload.comments,
      questions: payload.questions,
    })
    .then(unwrapResponse<ScoreRecord>)
    .then(normalizeScore);
}

export function updateScore(id: number | string, payload: Record<string, unknown>) {
  return api.patch(`/scores/${id}`, payload).then(unwrapResponse<ScoreRecord>).then(normalizeScore);
}

export function getScoresByRegistration(registrationId: number | string) {
  return api
    .get(`/scores/registration/${registrationId}`)
    .then(unwrapResponse<Record<string, unknown>>)
    .then(flattenScores);
}

export function getScoresSummaryByRegistration(registrationId: number | string) {
  return api
    .get(`/scores/registration/${registrationId}`)
    .then(unwrapResponse<Record<string, unknown>>)
    .then(normalizeScoresByRegistration);
}

export function finalizeScore(
  registrationId: number | string,
  payload?: Record<string, unknown>,
) {
  return api
    .post(`/scores/registration/${registrationId}/finalize`, payload ?? { formula: 'average' })
    .then(unwrapResponse<ScoreRecord>)
    .then(normalizeScore);
}
