import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TeamProvider, useTeam } from './context/TeamContext';
import { SprintProvider } from './context/SprintContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
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

const AuthRedirect = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { currentTeam, loading: teamLoading } = useTeam();

  // Wait for both auth and team to finish loading
  if (authLoading || teamLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to current team's dashboard if a team is selected
  if (currentTeam) {
    return <Navigate to={`/teams/${currentTeam._id}`} replace />;
  }

  // No team selected, go to team selection page
  return <Navigate to="/teams" replace />;
};

const AppRoutes = () => (
  <div className="min-h-screen bg-gray-50">
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

              {/* Team selection */}
              <Route
                path="/teams"
                element={
                  <PrivateRoute>
                    <TeamSelection />
                  </PrivateRoute>
                }
              />

              {/* Team-specific routes */}
              <Route
                path="/teams/:teamId/settings"
                element={
                  <PrivateRoute>
                    <>
                      <Navbar />
                      <TeamSettings />
                    </>
                  </PrivateRoute>
                }
              />
              <Route
                path="/teams/:teamId/members"
                element={
                  <PrivateRoute>
                    <>
                      <Navbar />
                      <TeamMembers />
                    </>
                  </PrivateRoute>
                }
              />

              {/* Private routes */}
              <Route
                path="/teams/:teamId"
                element={
                  <PrivateRoute>
                    <>
                      <Navbar />
                      <Dashboard />
                    </>
                  </PrivateRoute>
                }
              />
            <Route
              path="/history"
              element={
                <PrivateRoute>
                  <>
                    <Navbar />
                    <History />
                  </>
                </PrivateRoute>
              }
            />
            <Route
              path="/statistics"
              element={
                <PrivateRoute>
                  <>
                    <Navbar />
                    <Statistics />
                  </>
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <>
                    <Navbar />
                    <Profile />
                  </>
                </PrivateRoute>
              }
            />

<Route
  path="/projects"
  element={
    <PrivateRoute>
      <>
        <Navbar />
        <Projects />
      </>
    </PrivateRoute>
  }
/>

            {/* Team-scoped projects route */}
            <Route
              path="/teams/:teamId/projects"
              element={
                <PrivateRoute>
                  <>
                    <Navbar />
                    <Projects />
                  </>
                </PrivateRoute>
              }
            />

              {/* Sprint routes */}
            <Route
              path="/teams/:teamId/projects/:projectId/sprints"
              element={
                <PrivateRoute>
                  <>
                    <Navbar />
                    <SprintList />
                  </>
                </PrivateRoute>
              }
            />
            <Route
              path="/teams/:teamId/projects/:projectId"
              element={
                <PrivateRoute>
                  <>
                    <Navbar />
                    <Projects />
                  </>
                </PrivateRoute>
              }
            />
            <Route
              path="/teams/:teamId/projects/:projectId/sprints/:sprintId"
              element={
                <PrivateRoute>
                  <SprintBoard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/teams/:teamId/projects/:projectId/backlog"
                element={
                  <PrivateRoute>
                    <>
                      <Navbar />
                      <Backlog />
                    </>
                  </PrivateRoute>
                }
              />

              {/* Admin routes */}
              <Route
                path="/teams/:teamId/admin"
                element={
                  <PrivateRoute>
                    <>
                      <Navbar />
                      <AdminDashboard />
                    </>
                  </PrivateRoute>
                }
              />
              <Route
                path="/teams/:teamId/admin/analytics"
                element={
                  <PrivateRoute>
                    <>
                      <Navbar />
                      <div className="py-8">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                          <TeamAnalytics />
                        </div>
                      </div>
                    </>
                  </PrivateRoute>
                }
              />
              <Route
                path="/teams/:teamId/team-activity"
                element={
                  <PrivateRoute>
                    <>
                      <Navbar />
                      <TeamActivity />
                    </>
                  </PrivateRoute>
                }
              />

              {/* Bandwidth routes */}
              <Route
                path="/teams/:teamId/bandwidth"
                element={
                  <PrivateRoute>
                    <>
                      <Navbar />
                      <BandwidthReports />
                    </>
                  </PrivateRoute>
                }
              />
              <Route
                path="/teams/:teamId/bandwidth/new"
                element={
                  <PrivateRoute>
                    <>
                      <Navbar />
                      <CreateBandwidthReport />
                    </>
                  </PrivateRoute>
                }
              />

            {/* Catch all */}
            <Route path="*" element={<AuthRedirect />} />
          </Routes>
        </div>
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
