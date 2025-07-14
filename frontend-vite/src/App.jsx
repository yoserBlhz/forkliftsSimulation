import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Simulations from './pages/Simulations';

const SIDEBAR_WIDTH = 220;

function App() {
  return (
    <Router>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, ml: `${SIDEBAR_WIDTH}px`, width: `calc(100% - ${SIDEBAR_WIDTH}px)` }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Forklift Dispatch Simulator
          </Typography>
        </Toolbar>
      </AppBar>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: `${SIDEBAR_WIDTH}px`, mt: '64px', minHeight: '100vh', background: '#f5f5f5' }}>
        <Routes>
          <Route path="/forklifts" element={<Dashboard />} />
          <Route path="/simulations" element={<Simulations />} />
          <Route path="/" element={<Navigate to="/forklifts" replace />} />
          {/* Future: <Route path="/orders" element={<Orders />} /> */}
          {/* Future: <Route path="/kpis" element={<KPIs />} /> */}
        </Routes>
      </Box>
    </Router>
  );
}

export default App; 