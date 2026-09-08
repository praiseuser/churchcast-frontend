import apiClient from "./client";

export async function startEgress(recordingId, payload = {}) {
  const { data } = await apiClient.post(`/egress/${recordingId}/start`, payload);
  return data;
}

export async function stopEgress(recordingId) {
  const { data } = await apiClient.post(`/egress/${recordingId}/stop`);
  return data;
}