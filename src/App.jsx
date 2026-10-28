import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Spinner, ErrorBoundary } from './components/UI/index';

// Layouts
import AdminLayout from './components/Layout/AdminLayout';
import PrincipalLayout from './components/Layout/PrincipalLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import ResourceTable from './pages/admin/ResourceTable';
import UploadScreen from './pages/admin/UploadScreen';
import UploadHistory from './pages/admin/UploadHistory';
import FlaggedStudents from './pages/admin/FlaggedStudents';
import ReportHome from './pages/principal/ReportHome';
import ReportView from './pages/principal/ReportView';

function RequireAuth({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner size={40} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'admin' ? '/admin' : '/principal'} replace />;
  return <Outlet />;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner size={40} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/principal'} replace />;
}

export default function App() {
  return (
    <ErrorBoundary title="Application Error">
      <BrowserRouter>
        <Routes>
          {/* Root */}
          <Route path="/" element={<RootRedirect />} />

          {/* Login */}
          <Route path="/login" element={<Login />} />

          {/* Admin routes */}
          <Route element={<RequireAuth roles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="upload" element={<UploadScreen />} />
              <Route path="upload-logs" element={<UploadHistory />} />
              <Route path="flagged" element={<FlaggedStudents />} />
              {/* All 13 resource tables via one component */}
              <Route path=":resource" element={<ResourceTable />} />
            </Route>
          </Route>

          {/* Principal routes */}
          <Route element={<RequireAuth roles={['principal', 'admin']} />}>
            <Route path="/principal" element={<PrincipalLayout />}>
              <Route index element={<ReportHome />} />
              <Route path="report/:reportId" element={<ReportView />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
