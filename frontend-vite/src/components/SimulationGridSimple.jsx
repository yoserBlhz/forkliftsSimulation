import React, { useState, useEffect, useRef } from 'react';
import { updateOrderStatus } from '../api/orders';

function getGridSize(locations) {
  const maxX = Math.max(...locations.map(l => l.displayX), 0);
  const maxY = Math.max(...locations.map(l => l.displayY), 0);
  return { width: maxX + 1, height: maxY + 1 };
}

const COLORS = [
  '#388e3c', '#1976d2', '#fbc02d', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b', '#f57c00', '#455a64', '#0097a7',
  '#afb42b', '#5d4037', '#c62828', '#00897b', '#6d4c41', '#fbc02d', '#0288d1', '#388e3c', '#1976d2', '#d32f2f'
];
function getForkliftColor(id) {
  return COLORS[id % COLORS.length];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export default function SimulationGridSimple({ locations, forklifts, orders }) {
  const gridSize = getGridSize(locations);
  const [simTime, setSimTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [resetFlag, setResetFlag] = useState(false);
  const [speed, setSpeed] = useState(1); // speed multiplier
  const intervalRef = useRef();
  const duration = 10; // seconds for each delivery

  // Find depot location
  const depot = locations.find(l => l.name.toLowerCase() === 'depot');
  const depotX = depot ? depot.displayX : 0;
  const depotY = depot ? depot.displayY : 0;

  // Animation phases: depot->pickup, pickup->delivery, delivery->depot
  const phase = duration / 3;
  const maxSimTime = 3 * phase;

  // Track order statuses
  const [orderStatuses, setOrderStatuses] = useState(orders.map(() => 'pending'));

  // Update order statuses as simTime advances
  useEffect(() => {
    const phase = duration / 3;
    orders.forEach((order, idx) => {
      let newStatus = 'pending';
      if (simTime < phase) {
        newStatus = 'pending';
      } else if (simTime < 2 * phase) {
        newStatus = 'on the way';
      } else if (simTime < 3 * phase) {
        newStatus = 'completed';
      } else {
        newStatus = 'completed';
      }
      if (orderStatuses[idx] !== newStatus) {
        updateOrderStatus(order.id, newStatus);
      }
    });
    setOrderStatuses(orders.map((order, idx) => {
      if (simTime < phase) {
        return 'pending';
      } else if (simTime < 2 * phase) {
        return 'on the way';
      } else if (simTime < 3 * phase) {
        return 'completed';
      } else {
        return 'completed';
      }
    }));
  }, [simTime, orders, duration]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setSimTime(t => {
          if (t + 1 * speed >= maxSimTime) {
            setPlaying(false);
            return maxSimTime;
          }
          return t + 1 * speed;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, maxSimTime]);

  // Reset logic: when resetFlag changes, reset simTime and stop playing
  useEffect(() => {
    if (resetFlag) {
      setSimTime(0);
      setPlaying(false);
      setTimeout(() => setResetFlag(false), 100); // clear flag after reset
    }
  }, [resetFlag]);

  // For each forklift, animate from depot to pickup, then to delivery, then back to depot, then stay at depot
  const forkliftPositions = forklifts.map((f, idx) => {
    const order = orders[idx % orders.length];
    if (!order) return { id: f.id, name: f.name, x: depotX, y: depotY };
    const pickup = locations.find(l => l.id === order.pickup_location_id);
    const delivery = locations.find(l => l.id === order.delivery_location_id);
    if (!pickup || !delivery) return { id: f.id, name: f.name, x: depotX, y: depotY };
    let x = depotX, y = depotY;
    if (resetFlag) {
      x = depotX;
      y = depotY;
    } else if (simTime < phase) {
      // depot to pickup
      const t = simTime / phase;
      x = Math.round(lerp(depotX, pickup.displayX, t));
      y = Math.round(lerp(depotY, pickup.displayY, t));
    } else if (simTime < 2 * phase) {
      // pickup to delivery
      const t = (simTime - phase) / phase;
      x = Math.round(lerp(pickup.displayX, delivery.displayX, t));
      y = Math.round(lerp(pickup.displayY, delivery.displayY, t));
    } else if (simTime < 3 * phase) {
      // delivery to depot
      const t = (simTime - 2 * phase) / phase;
      x = Math.round(lerp(delivery.displayX, depotX, t));
      y = Math.round(lerp(delivery.displayY, depotY, t));
    } else {
      // Stay at depot after one full cycle
      x = depotX;
      y = depotY;
    }
    return { id: f.id, name: f.name, x, y };
  });

  // Stop playing after one full cycle
  useEffect(() => {
    const phase = duration / 3;
    if (playing && simTime >= 3 * phase) {
      setPlaying(false);
    }
  }, [simTime, playing, duration]);

  return (
    <div style={{ display: 'inline-block', border: '2px solid #888', background: '#fafafa', margin: 16 }}>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setPlaying(p => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <span style={{ marginLeft: 12 }}>Simple Animation Time: {Math.round(simTime)}s</span>
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
                  // Show order status if this is a pickup or delivery location
                  let statusLabel = null;
                  orders.forEach((order, idx) => {
                    if (loc.id === order.pickup_location_id && orderStatuses[idx] === 'on the way') {
                      statusLabel = <span style={{ color: '#1976d2', fontSize: 10 }}>On the way</span>;
                    }
                    if (loc.id === order.delivery_location_id && orderStatuses[idx] === 'completed') {
                      statusLabel = <span style={{ color: '#388e3c', fontSize: 10 }}>Completed</span>;
                    }
                  });
                  content = <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#333', fontWeight: 400 }}>{loc.name}</span>
                    {statusLabel}
                  </div>;
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
      {/* Order status list */}
      <div style={{ marginTop: 16 }}>
        <b>Order Statuses:</b>
        <ul style={{ fontSize: 13 }}>
          {orders.map((order, idx) => (
            <li key={order.id}>
              Order {order.id}: {orderStatuses[idx]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 