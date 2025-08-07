import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export async function getOrders() {
  const response = await axios.get(`${API_BASE}/orders/`);
  return response.data;
}

export async function updateOrderStatus(orderId, status) {
  await axios.patch(`${API_BASE}/orders/${orderId}/status`, null, { params: { status } });
}

export async function resetAllOrders() {
  const response = await axios.post(`${API_BASE}/orders/reset-status`);
  return response.data;
} 