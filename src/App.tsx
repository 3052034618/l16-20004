import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Customers from '@/pages/Customers';
import Tasks from '@/pages/Tasks';
import CarePlans from '@/pages/CarePlans';
import Scheduling from '@/pages/Scheduling';
import Meals from '@/pages/Meals';
import Equipment from '@/pages/Equipment';
import Reports from '@/pages/Reports';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/care-plans" element={<CarePlans />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/schedules" element={<Scheduling />} />
          <Route path="/meals" element={<Meals />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
