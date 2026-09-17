import apiClient from "./client";

export async function getRecordings() {
  const { data } = await apiClient.get("/recordings");
  return data;
}

export async function getRecording(id) {
  const { data } = await apiClient.get(`/recordings/${id}`);
  return data;
}

export async function startRecording(payload) {
  const { data } = await apiClient.post("/recordings/start", payload);
  return data;
}

export async function exportRecording(id, payload) {
  const { data } = await apiClient.post(`/export/${id}`, payload);
  return data;
}

export async function getLiveRecordings() {
  const { data } = await apiClient.get("/recordings/live");
  return data;
}
