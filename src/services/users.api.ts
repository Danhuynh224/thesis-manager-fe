import type { QueryParams } from '../types/api';
import type { AuthUser } from '../types/auth';
import { unwrapResponse } from '../utils/response';
import { normalizeUser } from '../utils/mappers';
import { api } from './api';

export function getLecturers(params?: QueryParams) {
  return api
    .get('/users/lecturers', { params })
    .then(unwrapResponse<AuthUser[]>)
    .then((items) => items.map(normalizeUser));
}

export function getStudents(params?: QueryParams) {
  return api
    .get('/users/students', { params })
    .then(unwrapResponse<AuthUser[]>)
    .then((items) => items.map(normalizeUser));
}

export function getProfile() {
  return api.get('/users/me').then(unwrapResponse<AuthUser>).then(normalizeUser);
}

export function getMyFields() {
  return api.get('/fields/me').then(unwrapResponse<string[]>);
}
