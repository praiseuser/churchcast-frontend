import apiClient from "./client";

export async function startEgress(recordingId) {
  const { data } = await apiClient.post(`/egress/${recordingId}/start`);
  return data;
}

export async function stopEgress(recordingId) {
  const { data } = await apiClient.post(`/egress/${recordingId}/stop`);
  return data;
}