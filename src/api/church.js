import apiClient from "./client";

export async function getChurch() {
  const { data } = await apiClient.get("/church");
  return data;
}

export async function updateChurch(payload) {
  const { data } = await apiClient.put("/church", payload);
  return data;
}