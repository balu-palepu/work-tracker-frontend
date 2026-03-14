import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TeamProvider, useTeam } from './context/TeamContext';
import { SprintProvider } from './context/SprintContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Statistics from './pages/Statistics';
import Profile from './pages/Profile';
import Projects from './pages/Projects';
import TeamSelection from './pages/TeamSelection';
import TeamSettings from './pages/TeamSettings';
import TeamMembers from './pages/TeamMembers';
import SprintList from './pages/SprintList';
import SprintBoard from './pages/SprintBoard';
import Backlog from './pages/Backlog';
import AdminDashboard from './pages/AdminDashboard';
import BandwidthReports from './pages/BandwidthReports';
import CreateBandwidthReport from './pages/CreateBandwidthReport';
import TeamAnalytics from './components/admin/TeamAnalytics';
import TeamActivity from './pages/TeamActivity';
import ResetPassword from './pages/ResetPassword';
import TaskCreatePage from './pages/TaskCreatePage';
import TaskDetailPage from './pages/TaskDetailPage';
import TaskCompletionPage from './pages/TaskCompletionPage';
import Newsletters from './pages/Newsletters';
import NewsletterDetail from './pages/NewsletterDetail';
import NewsletterFormPage from './pages/NewsletterFormPage';
import ResourceManagement from './pages/ResourceManagement';
import ProjectCatalog from './pages/ProjectCatalog';
import CatalogDetailPage from './pages/CatalogDetailPage';
import CatalogFormPage from './pages/CatalogFormPage';
import ProjectIntakeForm from './pages/ProjectIntakeForm';


const AuthRedirect = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { currentTeam, loading: teamLoading } = useTeam();

  if (authLoading || teamLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentTeam) return <Navigate to={`/teams/${currentTeam._id}`} replace />;
  return <Navigate to="/teams" replace />;
};

// Wraps PrivateRoute + Layout together
const ProtectedLayout = ({ children }) => (
  <PrivateRoute>
    <Layout>{children}</Layout>
  </PrivateRoute>
);

const AppRoutes = () => (
  <>
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/" element={<AuthRedirect />} />

      {/* Team selection (no sidebar) */}
      <Route
        path="/teams"
        element={
          <PrivateRoute>
            <TeamSelection />
          </PrivateRoute>
        }
      />

      {/* Protected routes with sidebar layout */}
      <Route path="/teams/:teamId" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/teams/:teamId/settings" element={<ProtectedLayout><TeamSettings /></ProtectedLayout>} />
      <Route path="/teams/:teamId/members" element={<ProtectedLayout><TeamMembers /></ProtectedLayout>} />

      <Route path="/history" element={<ProtectedLayout><History /></ProtectedLayout>} />
      <Route path="/statistics" element={<ProtectedLayout><Statistics /></ProtectedLayout>} />
      <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
      <Route path="/projects" element={<ProtectedLayout><Projects /></ProtectedLayout>} />

      <Route path="/teams/:teamId/projects" element={<ProtectedLayout><Projects /></ProtectedLayout>} />
      <Route path="/teams/:teamId/projects/:projectId" element={<ProtectedLayout><Projects /></ProtectedLayout>} />

      {/* Sprint routes */}
      <Route path="/teams/:teamId/projects/:projectId/sprints" element={<ProtectedLayout><SprintList /></ProtectedLayout>} />
      <Route path="/teams/:teamId/projects/:projectId/sprints/:sprintId" element={<ProtectedLayout><SprintBoard /></ProtectedLayout>} />

      {/* Task routes */}
      <Route path="/teams/:teamId/projects/:projectId/tasks/new" element={<ProtectedLayout><TaskCreatePage /></ProtectedLayout>} />
      <Route path="/teams/:teamId/projects/:projectId/tasks/:taskId/complete" element={<ProtectedLayout><TaskCompletionPage /></ProtectedLayout>} />
      <Route path="/teams/:teamId/projects/:projectId/tasks/:taskId" element={<ProtectedLayout><TaskDetailPage /></ProtectedLayout>} />
      <Route path="/teams/:teamId/projects/:projectId/backlog" element={<ProtectedLayout><Backlog /></ProtectedLayout>} />

      {/* Admin routes */}
      <Route path="/teams/:teamId/admin" element={<ProtectedLayout><AdminDashboard /></ProtectedLayout>} />
      <Route
        path="/teams/:teamId/admin/analytics"
        element={
          <ProtectedLayout>
            <div className="py-8">
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <TeamAnalytics />
              </div>
            </div>
          </ProtectedLayout>
        }
      />
      <Route path="/teams/:teamId/team-activity" element={<ProtectedLayout><TeamActivity /></ProtectedLayout>} />

      {/* Bandwidth routes */}
      <Route path="/teams/:teamId/bandwidth" element={<ProtectedLayout><BandwidthReports /></ProtectedLayout>} />
      <Route path="/teams/:teamId/bandwidth/new" element={<ProtectedLayout><CreateBandwidthReport /></ProtectedLayout>} />

      {/* Newsletter routes */}
      <Route path="/teams/:teamId/newsletters" element={<ProtectedLayout><Newsletters /></ProtectedLayout>} />
      <Route path="/teams/:teamId/newsletters/new" element={<ProtectedLayout><NewsletterFormPage /></ProtectedLayout>} />
      <Route path="/teams/:teamId/newsletters/:newsletterId/edit" element={<ProtectedLayout><NewsletterFormPage /></ProtectedLayout>} />
      <Route path="/teams/:teamId/newsletters/:newsletterId" element={<ProtectedLayout><NewsletterDetail /></ProtectedLayout>} />

      {/* Resource Management */}
      <Route path="/teams/:teamId/resources" element={<ProtectedLayout><ResourceManagement /></ProtectedLayout>} />

      {/* Project Intake Form */}
      <Route path="/teams/:teamId/project-intake" element={<ProtectedLayout><ProjectIntakeForm /></ProtectedLayout>} />


      {/* Project Catalog */}
      <Route path="/teams/:teamId/catalog" element={<ProtectedLayout><ProjectCatalog /></ProtectedLayout>} />
      <Route path="/teams/:teamId/catalog/new" element={<ProtectedLayout><CatalogFormPage /></ProtectedLayout>} />
      <Route path="/teams/:teamId/catalog/:catalogId/edit" element={<ProtectedLayout><CatalogFormPage /></ProtectedLayout>} />
      <Route path="/teams/:teamId/catalog/:catalogId" element={<ProtectedLayout><CatalogDetailPage /></ProtectedLayout>} />

      {/* Catch all */}
      <Route path="*" element={<AuthRedirect />} />
    </Routes>
  </>
);

function App() {
  return (
    <AuthProvider>
      <TeamProvider>
        <SprintProvider>
          <Router>
            <AppRoutes />
          </Router>
        </SprintProvider>
      </TeamProvider>
    </AuthProvider>
  );
}

export default App;
