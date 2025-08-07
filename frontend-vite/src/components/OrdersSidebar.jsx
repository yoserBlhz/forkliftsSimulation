import React from 'react';

const COLORS = [
  '#388e3c', '#1976d2', '#fbc02d', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b', '#f57c00', '#455a64', '#0097a7',
  '#afb42b', '#5d4037', '#c62828', '#00897b', '#6d4c41', '#fbc02d', '#0288d1', '#388e3c', '#1976d2', '#d32f2f'
];

function getForkliftColor(id) {
  return COLORS[id % COLORS.length];
}

function getOrderStatusColor(status) {
  switch (status) {
    case 'completed': return '#4caf50';
    case 'on the way': return '#ff9800';
    case 'pending': return '#c0b444ff';
    default: return '#757575';
  }
}

export default function OrdersSidebar({ orders, forklifts, locations, plans, onSelectOrder, selectedOrderId, onFilterChange, filters }) {
  const getLocationName = (id) => {
    const loc = locations.find(l => l.id === id);
    return loc ? loc.name : id;
  };
  const getForkliftName = (id) => {
    const f = forklifts.find(f => f.id === id);
    return f ? f.name : id;
  };
  const statuses = Array.from(new Set(orders.map(o => o.status)));

  // Filter orders based on plans data
  const filteredOrders = orders.filter(order => {
    let ok = true;
    if (filters.status && order.status !== filters.status) ok = false;
    if (filters.forkliftId) {
      // Check if this order is assigned to the selected forklift in plans
      const orderPlan = plans.find(p => p.order_id === order.id);
      if (!orderPlan || orderPlan.forklift_id !== parseInt(filters.forkliftId)) {
        ok = false;
      }
    }
    return ok;
  });

  return (
    <div style={{ width: 300, background: '#f5f5f5', padding: 16, borderRight: '1px solid #ccc', height: '100vh', overflowY: 'auto' }}>
      <h3>Deliveries / Orders</h3>
      
      {/* Status Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, backgroundColor: '#4caf50', borderRadius: '50%' }}></div>
          <span style={{ fontSize: 12 }}>Completed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, backgroundColor: '#ff9800', borderRadius: '50%' }}></div>
          <span style={{ fontSize: 12 }}>On the way</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, backgroundColor: '#c0b444ff', borderRadius: '50%' }}></div>
          <span style={{ fontSize: 12 }}>Pending</span>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Status: </label>
        <select value={filters.status || ''} onChange={e => onFilterChange({ ...filters, status: e.target.value })}>
          <option value=''>All</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Forklift ID: </label>
        <select value={filters.forkliftId || ''} onChange={e => onFilterChange({ ...filters, forkliftId: e.target.value })}>
          <option value=''>All</option>
          {forklifts.map(f => <option key={f.id} value={f.id}>Forklift {f.id} ({f.name})</option>)}
        </select>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {filteredOrders.map(order => {
          const orderPlan = plans.find(p => p.order_id === order.id);
          const assignedForklift = orderPlan ? forklifts.find(f => f.id === orderPlan.forklift_id) : null;
          const forkliftColor = assignedForklift ? getForkliftColor(assignedForklift.id) : '#ccc';
          const statusColor = getOrderStatusColor(order.status);
          
          return (
            <li key={order.id} style={{ 
              marginBottom: 8, 
              background: order.id === selectedOrderId ? '#b3e5fc' : '#fff', 
              borderRadius: 4, 
              cursor: 'pointer', 
              padding: 8,
              borderLeft: `4px solid ${forkliftColor}`,
              borderTop: `2px solid ${forkliftColor}`
            }} onClick={() => onSelectOrder(order.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ 
                  width: 12, 
                  height: 12, 
                  backgroundColor: statusColor, 
                  borderRadius: '50%'
                }}></div>
               
                <span><b>Order #{order.id}</b></span>
                <span style={{ color: statusColor, fontWeight: 'bold' }}>({order.status})</span>
              </div>
              <div style={{ fontSize: 13 }}>From: {getLocationName(order.pickup_location_id)} → To: {getLocationName(order.delivery_location_id)}</div>
              {assignedForklift && (
                <div style={{ 
                  fontSize: 12, 
                  color: forkliftColor, 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <div style={{ 
                    width: 8, 
                    height: 8, 
                    backgroundColor: forkliftColor, 
                    borderRadius: '50%' 
                  }}></div>
                  Forklift: {assignedForklift.name} (ID: {assignedForklift.id})
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
} 