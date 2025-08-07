import React, { useEffect, useState } from 'react';
import SimulationGrid from '../components/SimulationGrid';
import OrdersSidebar from '../components/OrdersSidebar';
import ForkliftList from '../components/ForkliftList';
import SimulationGridSimple from '../components/SimulationGridSimple';
import ForkliftStatusList from '../components/ForkliftStatusList';
import { getForklifts, getLocations, getMaps, getPlans, resetPlanTimes, blockForklift, unblockForklift, resetAllForklifts } from '../api/forklifts';
import { getOrders, resetAllOrders } from '../api/orders';
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
  const [forkliftStatusFilter, setForkliftStatusFilter] = useState('');

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [forkliftsData, locationsData, mapsData, ordersData, plansData] = await Promise.all([
        getForklifts(),
        getLocations(),
        getMaps(),
        getOrders(),
        getPlans()
      ]);
      setForklifts(forkliftsData);
      setLocations(locationsData);
      setMaps(mapsData);
      setOrders(ordersData);
      setPlans(plansData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleResetTimes = async () => {
    await resetPlanTimes();
    await fetchAll();
  };

  const handleBlock = async (forkliftId) => {
    await blockForklift(forkliftId);
    fetchAll();
  };

  const handleUnblock = async (forkliftId) => {
    await unblockForklift(forkliftId);
    fetchAll();
  };

  const handleResetAll = async () => {
    await resetAllForklifts();
    await resetAllOrders();
    fetchAll();
  };

  const handleOrderStatusChange = () => {
    // Refresh orders data when simulation updates order status
    getOrders().then(setOrders);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box sx={{ mt: 4, display: 'flex', flexDirection: 'row' }}>
      <ForkliftStatusList
        forklifts={forklifts}
        locations={locations}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onReset={handleResetAll}
        statusFilter={forkliftStatusFilter}
        onStatusFilterChange={setForkliftStatusFilter}
      />
      <OrdersSidebar
        orders={orders}
        forklifts={forklifts}
        locations={locations}
        plans={plans}
        onSelectOrder={setSelectedOrderId}
        selectedOrderId={selectedOrderId}
        onFilterChange={setFilters}
        filters={filters}
      />
      <Box sx={{ flex: 1, pl: 2 }}>
        <Typography variant="h4" gutterBottom>Simulation</Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <SimulationGridSimple
            locations={locations}
            forklifts={forklifts}
            orders={orders}
            onOrderStatusChange={handleOrderStatusChange}
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