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

export default function SimulationGridSimple({ locations, forklifts, orders, plans, onOrderStatusChange }) {
  const gridSize = getGridSize(locations);
  const [simTime, setSimTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [resetFlag, setResetFlag] = useState(false);
  const intervalRef = useRef();
  const duration = 30; // 30 seconds for full cycle
  const phase = duration / 3; // 10 seconds per phase
  const maxSimTime = 3 * phase; // 30 seconds total

  // Find depot location
  const depot = locations.find(l => l.name.toLowerCase() === 'depot');
  const depotX = depot ? depot.displayX : 0;
  const depotY = depot ? depot.displayY : 0;

  // Track order statuses
  const [orderStatuses, setOrderStatuses] = useState(orders.map(() => 'pending'));

  // Helper: get assigned forklift for an order from plans
  function getAssignedForklift(orderId) {
    const plan = plans && plans.find(p => p.order_id === orderId);
    if (!plan) return null;
    return forklifts.find(f => f.id === plan.forklift_id);
  }

  // Update order statuses as simTime advances
  useEffect(() => {
    const phase = duration / 3;
    orders.forEach((order, idx) => {
      // Find the assigned forklift for this order using plans
      const assignedForklift = getAssignedForklift(order.id);
      let newStatus = 'pending';
      if (assignedForklift && assignedForklift.status === 'available') {
        // Only update status if forklift is available
        if (simTime < phase) {
          newStatus = 'pending';
        } else if (simTime < 2 * phase) {
          newStatus = 'on the way';
        } else if (simTime < 3 * phase) {
          newStatus = 'completed';
        } else {
          newStatus = 'completed';
        }
      } else {
        // Forklift is blocked or not available, keep as pending
        newStatus = 'pending';
      }
      if (orderStatuses[idx] !== newStatus) {
        updateOrderStatus(order.id, newStatus);
        // Notify parent component that order status changed
        if (onOrderStatusChange) {
          onOrderStatusChange();
        }
      }
    });
    setOrderStatuses(orders.map((order, idx) => {
      const assignedForklift = getAssignedForklift(order.id);
      if (assignedForklift && assignedForklift.status === 'available') {
        if (simTime < phase) {
          return 'pending';
        } else if (simTime < 2 * phase) {
          return 'on the way';
        } else if (simTime < 3 * phase) {
          return 'completed';
        } else {
          return 'completed';
        }
      } else {
        return 'pending';
      }
    }));
  }, [simTime, orders, duration, onOrderStatusChange, forklifts, plans]);

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
    // Find the order assigned to this forklift (from plans)
    const plan = plans && plans.find(p => p.forklift_id === f.id);
    const order = plan ? orders.find(o => o.id === plan.order_id) : null;
    // If forklift is blocked or not available, keep it at depot
    if (f.status === 'blocked' || f.status === 'not available') {
      return { id: f.id, name: f.name, x: depotX, y: depotY };
    }
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

  // Forklifts at depot (calculated after positions)
  const forkliftsAtDepot = forkliftPositions.filter(f => f.x === depotX && f.y === depotY);
  // Forklifts not at depot
  const forkliftsNotAtDepot = forkliftPositions.filter(f => !(f.x === depotX && f.y === depotY));

  // Stop playing after one full cycle
  useEffect(() => {
    const phase = duration / 3;
    if (playing && simTime >= 3 * phase) {
      setPlaying(false);
    }
  }, [simTime, playing, duration]);

  return (
    <div style={{ display: 'inline-block', border: '2px solid #888', background: '#fafafa', margin: 16 }}>
      {/* Depot Row */}
      {depot && (
        <div style={{
          display: 'flex', alignItems: 'center', padding: '8px 12px', background: '#ffe0b2', borderBottom: '2px solid #ccc', marginBottom: 8, borderTopLeftRadius: 6, borderTopRightRadius: 6
        }}>
          <span style={{ fontWeight: 600, color: '#b26a00', marginRight: 16, fontSize: 15 }}>Depot</span>
          {forkliftsAtDepot.length === 0 && <span style={{ color: '#888', fontSize: 13 }}>No forklifts at depot</span>}
          {forkliftsAtDepot.map(f => (
            <div key={f.id} style={{
              background: getForkliftColor(f.id),
              color: '#fff',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 'bold',
              border: '2px solid #fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              marginRight: 8
            }} title={f.name ? f.name : ''}>
              F{f.id}
            </div>
          ))}
        </div>
      )}
      {/* Main Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${gridSize.width}, 48px)`,
        gridTemplateRows: `repeat(${gridSize.height}, 48px)`,
        border: '1px solid #ccc',
        position: 'relative',
        width: gridSize.width * 48,
        height: gridSize.height * 48
      }}>
        {/* Render Trajectory Paths First (as background) */}
        {/* trajectories.map((trajectory, idx) => {
          const fromX = trajectory.from.x * 48 + 24;
          const fromY = trajectory.from.y * 48 + 24;
          const toX = trajectory.to.x * 48 + 24;
          const toY = trajectory.to.y * 48 + 24;
          return (
            <div
              key={`trajectory-${idx}`}
              style={{
                position: 'absolute',
                left: fromX,
                top: fromY,
                width: Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2)),
                height: 4,
                background: '#888',
                transform: `rotate(${Math.atan2(toY - fromY, toX - fromX)}rad)`,
                transformOrigin: '0 50%',
                zIndex: 1,
                borderRadius: 2
              }}
            />
          );
        })} */}
        {/* Render Grid Cells */}
        {[...Array(gridSize.height)].map((_, y) => 
          [...Array(gridSize.width)].map((_, x) => {
            // Skip rendering the depot cell
            if (depot && x === depotX && y === depotY) return null;
            const loc = locations.find(l => l.displayX === x && l.displayY === y);
            let cellStyle = {
              width: 48, height: 48, border: '1px solid #ccc', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: loc ? '#e0f7fa' : '#fff',
              position: 'relative',
              zIndex: 2
            };
            let content = null;
            
            // Show forklifts (not at depot)
            const forkliftsHere = forkliftsNotAtDepot.filter(f => f.x === x && f.y === y);
            if (forkliftsHere.length > 0) {
              content = (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {forkliftsHere.map(f => (
                    <div key={f.id} style={{ 
                      background: getForkliftColor(f.id), 
                      color: '#fff', 
                      borderRadius: '50%', 
                      width: 28, 
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 'bold',
                      border: '2px solid #fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>F{f.id}</div>
                  ))}
                  {loc && <span style={{ fontSize: 10, color: '#333', fontWeight: 400, marginTop: 2 }}>{loc.name}</span>}
                </div>
              );
            } else if (loc) {
              // Show location name if not occupied by forklift
              let statusLabel = null;
              orders.forEach((order, idx) => {
                if (loc.id === order.pickup_location_id && orderStatuses[idx] === 'on the way') {
                  statusLabel = <span style={{ color: '#1976d2', fontSize: 10 }}>On way</span>;
                }
                if (loc.id === order.delivery_location_id && orderStatuses[idx] === 'completed') {
                  statusLabel = <span style={{ color: '#388e3c', fontSize: 10 }}>Done</span>;
                }
              });
              content = (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#333', fontWeight: 400 }}>{loc.name}</span>
                  {statusLabel}
                </div>
              );
            }
            
            // Add tooltip for location name
            return (
              <div key={`${x}-${y}`} style={cellStyle} title={loc ? loc.name : ''}>
                {content}
              </div>
            );
          })
        )}
      </div>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setPlaying(p => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <span style={{ marginLeft: 12 }}>Simple Animation Time: {Math.round(simTime)}s</span>
        <label style={{ marginLeft: 16 }}>Speed: <input type="number" min={0.1} max={10} step={0.1} value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ width: 50 }} />x</label>
        <button style={{ marginLeft: 16 }} onClick={() => setResetFlag(true)}>Reset</button>
      </div>
    </div>
  );
} 