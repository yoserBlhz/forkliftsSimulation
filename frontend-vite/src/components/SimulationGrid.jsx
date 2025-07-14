import React, { useState, useEffect, useRef } from 'react';

// Utility to get grid size
function getGridSize(locations) {
  const maxX = Math.max(...locations.map(l => l.displayX), 0);
  const maxY = Math.max(...locations.map(l => l.displayY), 0);
  return { width: maxX + 1, height: maxY + 1 };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Color palette for forklifts
const COLORS = [
  '#388e3c', '#1976d2', '#fbc02d', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b', '#f57c00', '#455a64', '#0097a7',
  '#afb42b', '#5d4037', '#c62828', '#00897b', '#6d4c41', '#fbc02d', '#0288d1', '#388e3c', '#1976d2', '#d32f2f'
];
function getForkliftColor(id) {
  return COLORS[id % COLORS.length];
}

export default function SimulationGrid({ locations, forklifts, orders, plans, highlightOrderId }) {
  const gridSize = getGridSize(locations);
  const [simTime, setSimTime] = useState(0); // seconds
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // simulation speed multiplier
  const [resetFlag, setResetFlag] = useState(false);
  const intervalRef = useRef();

  console.log('plans:', plans, 'simTime:', simTime, 'forklifts:', forklifts, 'orders:', orders);

  // Find depot location (by name or a special flag)
  const depot = locations.find(l => l.name.toLowerCase() === 'depot');
  const depotX = depot ? depot.displayX : 0;
  const depotY = depot ? depot.displayY : 0;

  // Find simulation time bounds
  const allTimes = plans.flatMap(p => [p.start_time, p.end_time].filter(Boolean).map(t => new Date(t).getTime()/1000));
  const minTime = Math.min(...allTimes, 0);
  const maxTime = Math.max(...allTimes, 1);

  // Compute the first plan's start time in seconds
  const allPlanTimes = plans.flatMap(p => [p.start_time, p.end_time].filter(Boolean).map(t => new Date(t).getTime()/1000));
  const minPlanTime = Math.min(...allPlanTimes, 0);
  const effectiveSimTime = minPlanTime + simTime;

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setSimTime(t => Math.min(maxTime, t + 1 * speed));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, maxTime]);

  // Reset logic: when resetFlag changes, reset simTime and stop playing
  useEffect(() => {
    if (resetFlag) {
      setSimTime(0);
      setPlaying(false);
      setTimeout(() => setResetFlag(false), 100); // clear flag after reset
    }
  }, [resetFlag]);

  // Build lookup maps
  const locationMap = Object.fromEntries(locations.map(l => [l.id, l]));
  const planMap = plans.reduce((acc, p) => { acc[p.forklift_id] = acc[p.forklift_id] || []; acc[p.forklift_id].push(p); return acc; }, {});

  // For each forklift, determine its interpolated position
  const forkliftPositions = forklifts.map(f => {
    if (resetFlag || !depot) {
      return { id: f.id, name: f.name, x: depotX, y: depotY };
    }
    const plansForForklift = (planMap[f.id] || []).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    // Find the current plan
    let currentPlan, prevPlan;
    for (let i = 0; i < plansForForklift.length; i++) {
      const p = plansForForklift[i];
      const start = new Date(p.start_time).getTime()/1000;
      const end = new Date(p.end_time).getTime()/1000;
      if (effectiveSimTime < start) break;
      if (effectiveSimTime >= start && effectiveSimTime <= end) {
        currentPlan = p;
        break;
      }
      prevPlan = p;
    }
    if (!currentPlan && prevPlan) {
      // After last plan: return to depot
      const end = new Date(prevPlan.end_time).getTime()/1000;
      const order = prevPlan.order;
      const delivery = locationMap[order.delivery_location_id];
      const t = Math.max(0, Math.min(1, (effectiveSimTime - end) / 10)); // 10s to return
      const x = Math.round(lerp(delivery.displayX, depotX, t));
      const y = Math.round(lerp(delivery.displayY, depotY, t));
      return { id: f.id, name: f.name, x, y };
    }
    if (currentPlan && currentPlan.order) {
      const order = currentPlan.order;
      const pickup = locationMap[order.pickup_location_id];
      const delivery = locationMap[order.delivery_location_id];
      const start = new Date(currentPlan.start_time).getTime()/1000;
      const end = new Date(currentPlan.end_time).getTime()/1000;
      // Three phases: depot→pickup, pickup→delivery
      const depotToPickupTime = 10; // seconds
      if (effectiveSimTime < start + depotToPickupTime) {
        // Move from depot to pickup
        const t = Math.max(0, Math.min(1, (effectiveSimTime - start) / depotToPickupTime));
        const x = Math.round(lerp(depotX, pickup.displayX, t));
        const y = Math.round(lerp(depotY, pickup.displayY, t));
        return { id: f.id, name: f.name, x, y };
      } else {
        // Move from pickup to delivery
        const t = Math.max(0, Math.min(1, (effectiveSimTime - (start + depotToPickupTime)) / (end - start - depotToPickupTime)));
        const x = Math.round(lerp(pickup.displayX, delivery.displayX, t));
        const y = Math.round(lerp(pickup.displayY, delivery.displayY, t));
        return { id: f.id, name: f.name, x, y };
      }
    }
    // Before first plan: stay at depot
    return { id: f.id, name: f.name, x: depotX, y: depotY };
  });

  // Highlight for selected order
  let highlightPickup = null, highlightDelivery = null;
  if (highlightOrderId) {
    const order = orders.find(o => o.id === highlightOrderId);
    if (order) {
      highlightPickup = order.pickup_location_id;
      highlightDelivery = order.delivery_location_id;
    }
  }

  return (
    <div style={{ display: 'inline-block', border: '2px solid #888', background: '#fafafa', margin: 16 }}>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setPlaying(p => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <span style={{ marginLeft: 12 }}>Time: {Math.round(simTime)}s</span>
        <button style={{ marginLeft: 12 }} onClick={() => setSimTime(t => Math.max(minTime, t - 1))}>&lt;</button>
        <button style={{ marginLeft: 4 }} onClick={() => setSimTime(t => Math.min(maxTime, t + 1))}>&gt;</button>
        <label style={{ marginLeft: 16 }}>Speed: <input type="number" min={0.1} max={10} step={0.1} value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ width: 50 }} />x</label>
        <button style={{ marginLeft: 16 }} onClick={() => setResetFlag(true)}>Reset</button>
      </div>
      <table style={{ borderCollapse: 'collapse' }}>
        <tbody>
          {[...Array(gridSize.height)].map((_, y) => (
            <tr key={y}>
              {[...Array(gridSize.width)].map((_, x) => {
                const loc = locations.find(l => l.displayX === x && l.displayY === y);
                let cellStyle = {
                  width: 32, height: 32, border: '1px solid #ccc', textAlign: 'center', verticalAlign: 'middle',
                  background: loc ? '#e0f7fa' : '#fff',
                  position: 'relative',
                };
                let content = null;
                // Highlight depot
                if (depot && loc && loc.id === depot.id) {
                  cellStyle.background = '#ffe0b2';
                  content = (
                    <div style={{ fontWeight: 600, color: '#b26a00', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      Depot
                      <span style={{ fontSize: 11, color: '#333', fontWeight: 400 }}>{loc.name}</span>
                    </div>
                  );
                }
                // Show forklifts
                const forkliftsHere = forkliftPositions.filter(f => f.x === x && f.y === y);
                if (forkliftsHere.length > 0) {
                  content = (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {forkliftsHere.map(f => (
                        <div key={f.id} style={{ background: getForkliftColor(f.id), color: '#fff', borderRadius: 4, padding: 2, margin: 1 }}>F{f.id}</div>
                      ))}
                      {loc && <span style={{ fontSize: 11, color: '#333', fontWeight: 400 }}>{loc.name}</span>}
                    </div>
                  );
                } else if (loc && (!depot || loc.id !== depot.id)) {
                  // Show location name if not depot and not occupied by forklift
                  content = <span style={{ fontSize: 11, color: '#333', fontWeight: 400 }}>{loc.name}</span>;
                }
                return <td key={x} style={cellStyle}>{content}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Legend */}
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ marginRight: 8, fontWeight: 500 }}>Legend:</span>
        {forklifts.map(f => (
          <span key={f.id} style={{ display: 'inline-flex', alignItems: 'center', marginRight: 16 }}>
            <span style={{ width: 18, height: 18, background: getForkliftColor(f.id), display: 'inline-block', borderRadius: 4, marginRight: 4 }}></span>
            F{f.id} ({f.name})
          </span>
        ))}
        {depot && <span style={{ marginLeft: 16, color: '#b26a00', fontWeight: 600 }}>Depot</span>}
      </div>
    </div>
  );
} 