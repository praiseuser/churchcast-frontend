import apiClient from "./client";

export async function getMediaTeam() {
  const { data } = await apiClient.get("/auth/users");
  return data;
}

export async function addTeamMember(payload) {
  const { data } = await apiClient.post("/auth/users", payload);
  return data;
}

export async function updateTeamMember(id, payload) {
  const { data } = await apiClient.patch(`/auth/users/${id}`, payload);
  return data;
}