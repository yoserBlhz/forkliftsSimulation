import axios from 'axios';

const API_BASE = 'http://localhost:8000'; 

export async function getForklifts(status = null) {
  const params = status ? { status } : {};
  const response = await axios.get(`${API_BASE}/forklifts/`, { params });
  return response.data;
}

export async function blockForklift(forkliftId) {
  const response = await axios.post(`${API_BASE}/forklifts/${forkliftId}/block`);
  return response.data;
}

export async function unblockForklift(forkliftId) {
  const response = await axios.post(`${API_BASE}/forklifts/${forkliftId}/unblock`);
  return response.data;
}

export async function resetAllForklifts() {
  const response = await axios.post(`${API_BASE}/forklifts/reset-status`);
  return response.data;
}

export async function updateForkliftStatus(id, status) {
  await axios.patch(`${API_BASE}/forklifts/${id}/status`, { status });
}

export async function createForklift(data) {
  const response = await axios.post(`${API_BASE}/forklifts/`, data);
  return response.data;
} 

export async function getLocations() {
  const response = await axios.get(`${API_BASE}/warehouse/locations`);
  return response.data;
}

export async function getMaps() {
  const response = await axios.get(`${API_BASE}/warehouse/maps`);
  return response.data;
} 

export async function getPlans() {
  const response = await axios.get(`${API_BASE}/plans/all`);
  return response.data;
} 

export async function resetPlanTimes() {
  const response = await axios.post(`${API_BASE}/plans/reset_times`);
  return response.data;
} 