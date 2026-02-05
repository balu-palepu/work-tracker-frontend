import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { Menu, LogOut, User, BarChart3, Calendar, Settings, Shield, ChevronDown, Users } from 'lucide-react';
import TeamSwitcher from './team/TeamSwitcher';
import NotificationBell from './notifications/NotificationBell';
import teamService from '../services/teamService';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { currentTeam, isAdmin, isSME, teamMembership } = useTeam();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [isReportingManager, setIsReportingManager] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isManagerRole = teamMembership?.role === 'Manager';
  const canViewTeamActivity = (isManagerRole || isReportingManager) && !isAdmin();

  useEffect(() => {
    let isMounted = true;
    const checkReportingManager = async () => {
      if (!currentTeam || !user?._id) {
        if (isMounted) setIsReportingManager(false);
        return;
      }
      try {
        const response = await teamService.getTeamMembers(currentTeam._id);
        const members = response.data || [];
        const hasReports = members.some((member) => {
          const managerId = member.reportingManager?._id || member.user?.reportingManager;
          return managerId === user._id;
        });
        if (isMounted) setIsReportingManager(hasReports);
      } catch (error) {
        console.error('Error checking reporting manager:', error);
        if (isMounted) setIsReportingManager(false);
      }
    };
    checkReportingManager();
    return () => {
      isMounted = false;
    };
  }, [currentTeam, user]);

  // Helper function to check if link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Get link classes based on active state
  const getLinkClasses = (path) => {
    const baseClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
    const activeClasses = "bg-primary-50 text-primary-600 font-semibold";
    const inactiveClasses = "text-gray-700 hover:text-primary-600 hover:bg-gray-50";
    
    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">WorkTracker</span>
            </Link>

            {currentTeam && (
              <div className="ml-6 pl-6 border-l border-gray-300">
                <TeamSwitcher />
              </div>
            )}

            <div className="hidden md:flex ml-10 space-x-4">
              {/* SMEs only see Projects */}
              {isSME() ? (
                <Link to="/projects" className={getLinkClasses('/projects')}>
                  Projects
                </Link>
              ) : (
                <>
                  {/* Regular users and admins see all navigation items */}
                  <Link
                    to="/"
                    className={getLinkClasses('/')}
                  >
                    Today
                  </Link>
                  <Link to="/projects" className={getLinkClasses('/projects')}>
                    Projects
                  </Link>
                  <Link
                    to="/history"
                    className={getLinkClasses('/history')}
                  >
                    History
                  </Link>
                  <Link
                    to="/statistics"
                    className={getLinkClasses('/statistics')}
                  >
                    Statistics
                  </Link>

                  {currentTeam && canViewTeamActivity && (
                    <Link
                      to={`/teams/${currentTeam._id}/team-activity`}
                      className={getLinkClasses(`/teams/${currentTeam._id}/team-activity`)}
                    >
                      Team Activity
                    </Link>
                  )}

                  {/* Admin dropdown for admins/managers */}
                  {currentTeam && isAdmin() && (
                    <div className="relative">
                      <button
                        onClick={() => setShowAdminMenu(!showAdminMenu)}
                        className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors"
                      >
                        <span>Admin</span>
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      {showAdminMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowAdminMenu(false)}
                          ></div>
                          <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                            <Link
                              to={`/teams/${currentTeam._id}/admin`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setShowAdminMenu(false)}
                            >
                              <div className="flex items-center space-x-2">
                                <Shield className="h-4 w-4" />
                                <span>Admin Dashboard</span>
                              </div>
                            </Link>
                            <Link
                              to={`/teams/${currentTeam._id}/settings`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setShowAdminMenu(false)}
                            >
                              <div className="flex items-center space-x-2">
                                <Settings className="h-4 w-4" />
                                <span>Team Settings</span>
                              </div>
                            </Link>
                            <Link
                              to={`/teams/${currentTeam._id}/members`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setShowAdminMenu(false)}
                            >
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4" />
                                <span>Team Members</span>
                              </div>
                            </Link>
                            <Link
                              to={`/teams/${currentTeam._id}/bandwidth`}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setShowAdminMenu(false)}
                            >
                              <div className="flex items-center space-x-2">
                                <BarChart3 className="h-4 w-4" />
                                <span>Bandwidth</span>
                              </div>
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Bandwidth link for regular users (non-admins, non-SMEs) */}
                  {currentTeam && !isAdmin() && (
                    <Link
                      to={`/teams/${currentTeam._id}/bandwidth`}
                      className={getLinkClasses(`/teams/${currentTeam._id}/bandwidth`)}
                    >
                      Bandwidth
                    </Link>
                  )}
                </>
              )}

            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            {currentTeam && <NotificationBell />}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="hidden md:block">{user?.name}</span>
                <Menu className="h-4 w-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </div>
                    </Link>

                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
