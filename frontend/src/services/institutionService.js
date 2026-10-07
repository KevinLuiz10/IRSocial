import { apiFetch } from "./api";

export function getInstitutions(filters = {}) {
  const params = new URLSearchParams();

  if (filters.city) params.append("city", filters.city);
  if (filters.fundType) params.append("fundType", filters.fundType);
  if (filters.year) params.append("year", filters.year);

  const query = params.toString();

  return apiFetch(`/instituicoes${query ? `?${query}` : ""}`);
}

export function getInstitutionById(id) {
  return apiFetch(`/instituicoes/${id}`);
}
