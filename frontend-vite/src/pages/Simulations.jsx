import React, { useEffect, useState } from 'react';
import SimulationGrid from '../components/SimulationGrid';
import OrdersSidebar from '../components/OrdersSidebar';
import ForkliftList from '../components/ForkliftList';
import SimulationGridSimple from '../components/SimulationGridSimple';
import { getForklifts, getLocations, getMaps, getPlans, resetPlanTimes } from '../api/forklifts';
import { getOrders } from '../api/orders';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

export default function Simulations() {
  const [forklifts, setForklifts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [maps, setMaps] = useState([]);
  const [orders, setOrders] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '', forkliftId: '' });
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [forklifts, locations, maps, orders, plans] = await Promise.all([
        getForklifts(), getLocations(), getMaps(), getOrders(), getPlans()
      ]);
      setForklifts(forklifts);
      setLocations(locations);
      setMaps(maps);
      setOrders(orders);
      setPlans(plans);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredOrders = orders.filter(order => {
    let ok = true;
    if (filters.status && order.status !== filters.status) ok = false;
    if (filters.forkliftId && String(order.forklift_id) !== String(filters.forkliftId)) ok = false;
    return ok;
  });

  const handleResetTimes = async () => {
    await resetPlanTimes();
    await fetchAll();
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box sx={{ mt: 4, display: 'flex', flexDirection: 'row' }}>
      <OrdersSidebar
        orders={filteredOrders}
        forklifts={forklifts}
        locations={locations}
        onSelectOrder={setSelectedOrderId}
        selectedOrderId={selectedOrderId}
        onFilterChange={setFilters}
        filters={filters}
      />
      <Box sx={{ flex: 1, pl: 2 }}>
        <Typography variant="h4" gutterBottom>Simulation</Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <SimulationGrid
            locations={locations}
            forklifts={forklifts}
            orders={filteredOrders}
            plans={plans}
            highlightOrderId={selectedOrderId}
          />
          <SimulationGridSimple
            locations={locations}
            forklifts={forklifts}
            orders={filteredOrders}
          />
          <button style={{ marginLeft: 24, height: 40 }} onClick={handleResetTimes}>
            Reset Simulation Times
          </button>
        </Box>
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Forklifts</Typography>
        <ForkliftList
          forklifts={forklifts}
          locations={locations}
          onBlock={() => {}}
          onUnblock={() => {}}
          onStatusChange={() => {}}
        />
      </Box>
    </Box>
  );
} 