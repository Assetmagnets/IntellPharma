import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Subscription from './pages/Subscription';
import Branches from './pages/Branches';
import Users from './pages/Users';
import Settings from './pages/Settings';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import { SuperAdminLayout, SuperAdminDashboard, Pharmacies, ActivityLogs, BlogManagement } from './pages/superadmin';


// Styles
import './index.css';
import './styles/glass.css';
import './styles/components.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/billing"
              element={
                <ProtectedRoute roles={['OWNER', 'MANAGER', 'PHARMACIST', 'BILLING_STAFF']}>
                  <Billing />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <ProtectedRoute roles={['OWNER', 'MANAGER', 'PHARMACIST', 'INVENTORY_STAFF']}>
                  <Inventory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute roles={['OWNER', 'MANAGER']}>
                  <Reports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/branches"
              element={
                <ProtectedRoute roles={['OWNER']}>
                  <Branches />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute roles={['OWNER', 'MANAGER']}>
                  <Users />
                </ProtectedRoute>
              }
            />

            <Route
              path="/subscription"
              element={
                <ProtectedRoute roles={['OWNER']}>
                  <Subscription />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute roles={['OWNER', 'MANAGER']}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Blog Routes for Regular Users */}
            <Route
              path="/blog"
              element={
                <ProtectedRoute>
                  <Blog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/blog/:id"
              element={
                <ProtectedRoute>
                  <BlogDetail />
                </ProtectedRoute>
              }
            />

            {/* Payment Result Routes */}
            <Route
              path="/payment-success"
              element={
                <ProtectedRoute roles={['OWNER']}>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />

            <Route
              path="/payment-cancel"
              element={
                <ProtectedRoute roles={['OWNER']}>
                  <PaymentCancel />
                </ProtectedRoute>
              }
            />




            {/* Super Admin Routes */}
            <Route
              path="/super-admin"
              element={
                <ProtectedRoute roles={['SUPERADMIN']}>
                  <SuperAdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              <Route path="pharmacies" element={<Pharmacies />} />
              <Route path="activity" element={<ActivityLogs />} />
              <Route path="blog" element={<BlogManagement />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Catch all - redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
