import React from 'react';

export default function OrdersSidebar({ orders, forklifts, locations, onSelectOrder, selectedOrderId, onFilterChange, filters }) {
  const getLocationName = (id) => {
    const loc = locations.find(l => l.id === id);
    return loc ? loc.name : id;
  };
  const getForkliftName = (id) => {
    const f = forklifts.find(f => f.id === id);
    return f ? f.name : id;
  };
  const statuses = Array.from(new Set(orders.map(o => o.status)));

  return (
    <div style={{ width: 300, background: '#f5f5f5', padding: 16, borderRight: '1px solid #ccc', height: '100vh', overflowY: 'auto' }}>
      <h3>Deliveries / Orders</h3>
      <div style={{ marginBottom: 12 }}>
        <label>Status: </label>
        <select value={filters.status || ''} onChange={e => onFilterChange({ ...filters, status: e.target.value })}>
          <option value=''>All</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Forklift: </label>
        <select value={filters.forkliftId || ''} onChange={e => onFilterChange({ ...filters, forkliftId: e.target.value })}>
          <option value=''>All</option>
          {forklifts.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {orders.map(order => (
          <li key={order.id} style={{ marginBottom: 8, background: order.id === selectedOrderId ? '#b3e5fc' : '#fff', borderRadius: 4, cursor: 'pointer', padding: 8 }} onClick={() => onSelectOrder(order.id)}>
            <div><b>Order #{order.id}</b> ({order.status})</div>
            <div style={{ fontSize: 13 }}>From: {getLocationName(order.pickup_location_id)} → To: {getLocationName(order.delivery_location_id)}</div>
            {order.forklift_id && <div style={{ fontSize: 12, color: '#555' }}>Forklift: {getForkliftName(order.forklift_id)}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
} 