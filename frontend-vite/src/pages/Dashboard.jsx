import React, { useEffect, useState } from 'react';
import ForkliftList from '../components/ForkliftList';
import SimulationGrid from '../components/SimulationGrid';
import OrdersSidebar from '../components/OrdersSidebar';
import { getForklifts, blockForklift, unblockForklift, updateForkliftStatus, createForklift, getLocations, getMaps, getPlans } from '../api/forklifts';
import { getOrders } from '../api/orders';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

export default function Dashboard() {
  const [forklifts, setForklifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', status: 'idle', x: '', y: '' });
  const [formError, setFormError] = useState('');
  const [locations, setLocations] = useState([]);
  const [maps, setMaps] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ status: '', forkliftId: '' });
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [plans, setPlans] = useState([]);

  const fetchForklifts = () => {
    setLoading(true);
    getForklifts()
      .then(data => setForklifts(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  const fetchLocations = () => {
    getLocations().then(setLocations);
  };
  const fetchMaps = () => {
    getMaps().then(setMaps);
  };

  const fetchOrders = () => {
    getOrders().then(setOrders);
  };

  const fetchPlans = () => {
    getPlans().then(setPlans);
  };

  useEffect(() => {
    fetchForklifts();
    fetchLocations();
    fetchMaps();
    fetchOrders();
    fetchPlans();
  }, []);

  const handleBlock = async (id) => {
    await blockForklift(id);
    fetchForklifts();
  };

  const handleUnblock = async (id) => {
    await unblockForklift(id);
    fetchForklifts();
  };

  const handleStatusChange = async (id, status) => {
    if (!status) return;
    await updateForkliftStatus(id, status);
    fetchForklifts();
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.status || form.x === '' || form.y === '') {
      setFormError('All fields are required.');
      return;
    }
    try {
      await createForklift({ ...form, x: Number(form.x), y: Number(form.y) });
      setForm({ name: '', status: 'idle', x: '', y: '' });
      fetchForklifts();
    } catch (err) {
      setFormError('Failed to create forklift.');
    }
  };

  const filteredOrders = orders.filter(order => {
    let ok = true;
    if (filters.status && order.status !== filters.status) ok = false;
    if (filters.forkliftId && String(order.forklift_id) !== String(filters.forkliftId)) ok = false;
    return ok;
  });

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box sx={{ mt: 4, display: 'flex', flexDirection: 'row' }}>
      {/* Remove OrdersSidebar, SimulationGrid, and related logic from Dashboard */}
      {/* Keep only summary, add new widgets, or leave as a placeholder */}
      <Box sx={{ flex: 1, pl: 2 }}>
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h5" gutterBottom>Add New Forklift</Typography>
          <form onSubmit={handleFormSubmit}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField label="Name" name="name" value={form.name} onChange={handleFormChange} required />
              <TextField label="Status" name="status" value={form.status} onChange={handleFormChange} required />
              <TextField label="X" name="x" value={form.x} onChange={handleFormChange} required type="number" />
              <TextField label="Y" name="y" value={form.y} onChange={handleFormChange} required type="number" />
              <Button type="submit" variant="contained">Add</Button>
            </Stack>
          </form>
          {formError && <Typography color="error" sx={{ mt: 1 }}>{formError}</Typography>}
        </Paper>
        <Typography variant="h4" gutterBottom>Forklifts</Typography>
        <ForkliftList
          forklifts={forklifts}
          locations={locations}
          onBlock={handleBlock}
          onUnblock={handleUnblock}
          onStatusChange={handleStatusChange}
        />
        {/* Remove SimulationGrid */}
        {/* <SimulationGrid
          locations={locations}
          forklifts={forklifts}
          orders={filteredOrders}
          plans={plans}
          highlightOrderId={selectedOrderId}
        /> */}
      </Box>
    </Box>
  );
} 