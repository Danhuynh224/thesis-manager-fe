import type { QueryParams } from "../types/api";
import type {
  Registration,
  RegistrationStatusHistoryItem,
} from "../types/models";
import { unwrapResponse } from "../utils/response";
import {
  normalizeRegistration,
  normalizeRegistrationDetail,
  normalizeRegistrationStatusHistoryItem,
} from "../utils/mappers";
import { api } from "./api";

export function createBctt(payload: Record<string, unknown>) {
  return api
    .post("/registrations/bctt", {
      tenDeTai: payload.title,
      linhVuc: payload.fieldName,
      tenCongTy: payload.companyName,
      emailGVHD: payload.supervisorEmail ?? payload.supervisorId,
      dot: payload.dot ?? payload.termCode ?? payload.termId,
    })
    .then(unwrapResponse<Registration>)
    .then(normalizeRegistration);
}

export function createKltn(payload: Record<string, unknown>) {
  return api
    .post("/registrations/kltn", {
      tenDeTai: payload.title,
      linhVuc: payload.fieldName,
      tenCongTy: payload.companyName,
      emailGVHD: payload.supervisorEmail ?? payload.supervisorId,
      dot: payload.dot ?? payload.termCode ?? payload.termId,
    })
    .then(unwrapResponse<Registration>)
    .then(normalizeRegistration);
}

export function getMyRegistrations() {
  return api
    .get("/registrations/me")
    .then(unwrapResponse<Registration[]>)
    .then((items) => items.map(normalizeRegistration));
}

export function getRegistrations(params?: QueryParams) {
  return api
    .get("/registrations", { params })
    .then(unwrapResponse<Registration[]>)
    .then((items) => items.map(normalizeRegistration));
}

export function getRegistrationDetail(id: number | string) {
  return api
    .get(`/registrations/${id}`)
    .then(unwrapResponse<Record<string, unknown>>)
    .then((data) => normalizeRegistrationDetail(data).registration);
}

export function getRegistrationStatusHistory(id: number | string) {
  return api
    .get(`/registrations/${id}/status-history`)
    .then(unwrapResponse<RegistrationStatusHistoryItem[]>)
    .then((items) => items.map(normalizeRegistrationStatusHistoryItem));
}

export function approveRegistration(
  id: number | string,
  payload?: Record<string, unknown>,
) {
  // Approve endpoint only accepts explicit DTO fields; never forward unknown keys.
  const body =
    payload?.tenDeTai || payload?.title
      ? { tenDeTai: payload.tenDeTai ?? payload.title }
      : {};
  return api
    .patch(`/registrations/${id}/approve`, body)
    .then(unwrapResponse<Registration>)
    .then(normalizeRegistration);
}

export function rejectRegistration(
  id: number | string,
  payload?: Record<string, unknown>,
) {
  return api
    .patch(`/registrations/${id}/reject`, payload)
    .then(unwrapResponse<Registration>)
    .then(normalizeRegistration);
}

export function changeSupervisor(
  id: number | string,
  payload: Record<string, unknown>,
) {
  return api
    .patch(`/registrations/${id}/change-supervisor`, {
      emailGVHD:
        payload.emailGVHD ?? payload.supervisorEmail ?? payload.supervisorId,
    })
    .then(unwrapResponse<Registration>)
    .then(normalizeRegistration);
}

export function changeReviewer(
  id: number | string,
  payload: Record<string, unknown>,
) {
  return api
    .patch(`/registrations/${id}/change-reviewer`, {
      emailGVPB:
        payload.emailGVPB ?? payload.reviewerEmail ?? payload.reviewerId,
    })
    .then(unwrapResponse<Registration>)
    .then(normalizeRegistration);
}

export function updateStatus(
  id: number | string,
  payload: Record<string, unknown>,
) {
  return api
    .patch(`/registrations/${id}/update-status`, payload)
    .then(unwrapResponse<Registration>)
    .then(normalizeRegistration);
}
