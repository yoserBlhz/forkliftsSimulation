import React from 'react';

const COLORS = [
  '#388e3c', '#1976d2', '#fbc02d', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b', '#f57c00', '#455a64', '#0097a7',
  '#afb42b', '#5d4037', '#c62828', '#00897b', '#6d4c41', '#fbc02d', '#0288d1', '#388e3c', '#1976d2', '#d32f2f'
];

function getForkliftColor(id) {
  return COLORS[id % COLORS.length];
}

function getStatusColor(status) {
  switch (status) {
    case 'available': return '#4caf50';
    case 'blocked': return '#f44336';
    case 'not available': return '#ff9800';
    default: return '#757575';
  }
}

export default function ForkliftStatusList({ forklifts, locations, onBlock, onUnblock, onReset, statusFilter, onStatusFilterChange }) {
  const getLocationName = (locationId) => {
    const loc = locations.find(l => l.id === locationId);
    return loc ? loc.name : 'Unknown';
  };

  const filteredForklifts = statusFilter 
    ? forklifts.filter(forklift => forklift.status === statusFilter)
    : forklifts;

  return (
    <div style={{ 
      width: 300, 
      background: '#f5f5f5', 
      padding: 16, 
      borderRight: '1px solid #ccc', 
      height: 'calc(100vh - 100px)', 
      display: 'flex', 
      flexDirection: 'column'
    }} className="custom-scrollbar">
      <h3>Forklift Status</h3>
      
      {/* Status Filter */}
      <div style={{ marginBottom: 12 }}>
        <label>Status Filter: </label>
        <select 
          value={statusFilter || ''} 
          onChange={e => onStatusFilterChange(e.target.value)}
          style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc' }}
        >
          <option value=''>All Statuses</option>
          <option value='available'>Available</option>
          <option value='blocked'>Blocked</option>
          <option value='not available'>Not Available</option>
        </select>
      </div>

      {/* Reset Button */}
      <button 
        onClick={onReset}
        style={{ 
          padding: '8px 16px', 
          fontSize: 12, 
          backgroundColor: '#2196f3', 
          color: '#fff', 
          border: 'none', 
          borderRadius: 4,
          cursor: 'pointer',
          marginBottom: 16
        }}
      >
        Reset All Status
      </button>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, backgroundColor: '#4caf50', borderRadius: '50%' }}></div>
          <span style={{ fontSize: 12 }}>Available</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, backgroundColor: '#f44336', borderRadius: '50%' }}></div>
          <span style={{ fontSize: 12 }}>Blocked</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, backgroundColor: '#ff9800', borderRadius: '50%' }}></div>
          <span style={{ fontSize: 12 }}>Not Available</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
        {filteredForklifts.map(forklift => {
          const statusColor = getStatusColor(forklift.status);
          return (
            <div key={forklift.id} style={{ 
              background: '#fff', 
              borderRadius: 8, 
              padding: 12, 
              border: `2px solid ${getForkliftColor(forklift.id)}`,
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ 
                  width: 16, 
                  height: 16, 
                  backgroundColor: getForkliftColor(forklift.id), 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 'bold'
                }}>
                  F{forklift.id}
                </div>
                <span style={{ fontWeight: 'bold' }}>{forklift.name}</span>
                <div style={{ 
                  width: 12, 
                  height: 12, 
                  backgroundColor: statusColor, 
                  borderRadius: '50%',
                  marginLeft: 'auto'
                }}></div>
              </div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                Status: <span style={{ color: statusColor, fontWeight: 'bold' }}>{forklift.status}</span>
              </div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                Location: {getLocationName(forklift.location_id)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => onBlock(forklift.id)}
                  disabled={forklift.status === 'blocked'}
                  style={{ 
                    padding: '4px 8px', 
                    fontSize: 11, 
                    backgroundColor: '#f44336', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 4,
                    cursor: forklift.status === 'blocked' ? 'not-allowed' : 'pointer',
                    opacity: forklift.status === 'blocked' ? 0.5 : 1
                  }}
                >
                  Block
                </button>
                <button 
                  onClick={() => onUnblock(forklift.id)}
                  disabled={forklift.status !== 'blocked'}
                  style={{ 
                    padding: '4px 8px', 
                    fontSize: 11, 
                    backgroundColor: '#4caf50', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 4,
                    cursor: forklift.status !== 'blocked' ? 'not-allowed' : 'pointer',
                    opacity: forklift.status !== 'blocked' ? 0.5 : 1
                  }}
                >
                  Unblock
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 